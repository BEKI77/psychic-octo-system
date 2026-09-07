import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { cylinders, inventoryTransactions, maintenanceRecords } from "../../database/schema/index.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import type { CompleteMaintenanceInput, CreateMaintenanceInput, MaintenanceFilter } from "./maintenance.schema.js";

const WITH_RELATIONS = {
  cylinder: { with: { cylinderType: true } },
  performedByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
  approvedByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class MaintenanceService {
  constructor(private readonly notificationsService: NotificationsService) {}

  findAll(filters: MaintenanceFilter = {}) {
    const conditions = [];
    if (filters.cylinderId) conditions.push(eq(maintenanceRecords.cylinderId, filters.cylinderId));
    if (filters.status) conditions.push(eq(maintenanceRecords.status, filters.status));

    return db.query.maintenanceRecords.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: WITH_RELATIONS,
      orderBy: desc(maintenanceRecords.reportedAt),
    });
  }

  async findOne(id: string) {
    const record = await db.query.maintenanceRecords.findFirst({
      where: eq(maintenanceRecords.id, id),
      with: WITH_RELATIONS,
    });
    if (!record) throw new NotFoundException("Maintenance record not found");
    return record;
  }

  /** Standalone report (outside the returns/inspection flow — e.g. found damaged during a stock check). */
  async create(input: CreateMaintenanceInput, userId: string) {
    const [cylinder] = await db.select().from(cylinders).where(eq(cylinders.id, input.cylinderId));
    if (!cylinder) throw new NotFoundException("Cylinder not found");
    if (cylinder.availabilityStatus === "SCRAPPED") {
      throw new ConflictException("Cylinder is scrapped and cannot be sent for maintenance");
    }

    const record = await db.transaction(async (tx) => {
      const [locked] = await tx.select().from(cylinders).where(eq(cylinders.id, input.cylinderId)).for("update");

      await tx
        .update(cylinders)
        .set({ conditionStatus: "UNDER_REPAIR", updatedAt: new Date() })
        .where(eq(cylinders.id, input.cylinderId));

      await tx.insert(inventoryTransactions).values({
        cylinderId: input.cylinderId,
        transactionType: "REPAIR_START",
        conditionBefore: locked.conditionStatus,
        conditionAfter: "UNDER_REPAIR",
        performedBy: userId,
        notes: input.description,
      });

      const [created] = await tx
        .insert(maintenanceRecords)
        .values({
          cylinderId: input.cylinderId,
          maintenanceType: input.maintenanceType,
          description: input.description,
        })
        .returning();
      return created;
    });

    return this.findOne(record.id);
  }

  async start(id: string, userId: string) {
    const record = await this.findOne(id);
    if (record.status !== "REPORTED") throw new ConflictException(`Maintenance record is already ${record.status}`);

    await db
      .update(maintenanceRecords)
      .set({ status: "IN_REPAIR", startedAt: new Date(), performedBy: userId, updatedAt: new Date() })
      .where(eq(maintenanceRecords.id, id));
    return this.findOne(id);
  }

  /** Marks the cylinder repaired and issuable again (§25: REPAIR -> AVAILABLE). */
  async complete(id: string, input: CompleteMaintenanceInput, userId: string) {
    const record = await this.findOne(id);
    if (record.status !== "IN_REPAIR") throw new ConflictException(`Maintenance record is already ${record.status}`);

    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(cylinders)
        .where(eq(cylinders.id, record.cylinderId))
        .for("update");

      await tx
        .update(cylinders)
        .set({ conditionStatus: "GOOD", updatedAt: new Date() })
        .where(eq(cylinders.id, record.cylinderId));

      await tx.insert(inventoryTransactions).values({
        cylinderId: record.cylinderId,
        transactionType: "REPAIR_COMPLETE",
        conditionBefore: locked.conditionStatus,
        conditionAfter: "GOOD",
        performedBy: userId,
      });

      await tx
        .update(maintenanceRecords)
        .set({
          status: "COMPLETED",
          completedAt: new Date(),
          cost: input.cost,
          approvedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(maintenanceRecords.id, id));
    });

    // §46 "Maintenance completed".
    await this.notificationsService.notifyByPermission("MAINTENANCE_MANAGE", {
      type: "MAINTENANCE_COMPLETED",
      title: "Repair completed",
      message: `${record.maintenanceNumber} (${record.cylinder.internalCode}) is repaired and available again.`,
      entityType: "maintenance_records",
      entityId: id,
    });

    return this.findOne(id);
  }

  async cancel(id: string) {
    const record = await this.findOne(id);
    if (record.status !== "REPORTED") throw new ConflictException("Only a reported (not yet started) record can be cancelled");

    await db.transaction(async (tx) => {
      await tx
        .update(cylinders)
        .set({ conditionStatus: "GOOD", updatedAt: new Date() })
        .where(eq(cylinders.id, record.cylinderId));

      await tx
        .update(maintenanceRecords)
        .set({ status: "CANCELLED", updatedAt: new Date() })
        .where(eq(maintenanceRecords.id, id));
    });

    return this.findOne(id);
  }
}
