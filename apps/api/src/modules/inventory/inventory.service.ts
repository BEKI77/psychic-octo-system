import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "../../database/db.js";
import {
  cylinderTypes,
  cylinders,
  inventoryTransactions,
  warehouses,
} from "../../database/schema/index.js";
import { WarehouseAccessService } from "../auth/warehouse-access.service.js";
import type { AdjustmentInput, MovementsQuery, TransferInput } from "./inventory.schema.js";

@Injectable()
export class InventoryService {
  constructor(private readonly warehouseAccessService: WarehouseAccessService) {}

  async summary() {
    const [{ value: totalCylinders }] = await db.select({ value: count() }).from(cylinders);

    const byAvailability = await db
      .select({ status: cylinders.availabilityStatus, value: count() })
      .from(cylinders)
      .groupBy(cylinders.availabilityStatus);

    const byCondition = await db
      .select({ status: cylinders.conditionStatus, value: count() })
      .from(cylinders)
      .groupBy(cylinders.conditionStatus);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayActivity = await db
      .select({ type: inventoryTransactions.transactionType, value: count() })
      .from(inventoryTransactions)
      .where(gte(inventoryTransactions.transactionDate, startOfToday))
      .groupBy(inventoryTransactions.transactionType);

    return { totalCylinders, byAvailability, byCondition, todayActivity };
  }

  async stock() {
    return db
      .select({
        warehouseId: warehouses.id,
        warehouseCode: warehouses.code,
        warehouseName: warehouses.name,
        cylinderTypeId: cylinderTypes.id,
        cylinderTypeCode: cylinderTypes.code,
        availabilityStatus: cylinders.availabilityStatus,
        value: count(),
      })
      .from(cylinders)
      .innerJoin(warehouses, eq(cylinders.currentWarehouseId, warehouses.id))
      .innerJoin(cylinderTypes, eq(cylinders.cylinderTypeId, cylinderTypes.id))
      .groupBy(
        warehouses.id,
        warehouses.code,
        warehouses.name,
        cylinderTypes.id,
        cylinderTypes.code,
        cylinders.availabilityStatus,
      )
      .orderBy(warehouses.code, cylinderTypes.code);
  }

  async movements(filters: MovementsQuery) {
    const conditions = [];
    if (filters.cylinderId) conditions.push(eq(inventoryTransactions.cylinderId, filters.cylinderId));
    if (filters.transactionType) {
      conditions.push(eq(inventoryTransactions.transactionType, filters.transactionType));
    }

    return db.query.inventoryTransactions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        cylinder: { columns: { id: true, internalCode: true, serialNumber: true } },
        fromWarehouse: { columns: { id: true, code: true } },
        toWarehouse: { columns: { id: true, code: true } },
        fromLocation: { columns: { id: true, code: true } },
        toLocation: { columns: { id: true, code: true } },
        performedByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
      },
      orderBy: desc(inventoryTransactions.transactionDate),
      limit: filters.limit ?? 100,
      offset: filters.offset ?? 0,
    });
  }

  /** Bulk-moves AVAILABLE cylinders between warehouses/locations, atomically. */
  async transfer(input: TransferInput, userId: string) {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, input.toWarehouseId));
    if (!warehouse) throw new NotFoundException("Destination warehouse not found");
    await this.warehouseAccessService.assertAccess(userId, input.toWarehouseId);

    await db.transaction(async (tx) => {
      for (const cylinderId of input.cylinderIds) {
        const [locked] = await tx.select().from(cylinders).where(eq(cylinders.id, cylinderId)).for("update");
        if (!locked) throw new NotFoundException(`Cylinder ${cylinderId} not found`);
        if (locked.availabilityStatus !== "AVAILABLE") {
          throw new ConflictException(
            `Cylinder ${locked.internalCode} cannot be transferred: it is currently ${locked.availabilityStatus}`,
          );
        }

        await tx
          .update(cylinders)
          .set({
            currentWarehouseId: input.toWarehouseId,
            currentLocationId: input.toLocationId ?? null,
            updatedAt: new Date(),
          })
          .where(eq(cylinders.id, cylinderId));

        await tx.insert(inventoryTransactions).values({
          cylinderId,
          transactionType: "TRANSFER",
          fromWarehouseId: locked.currentWarehouseId,
          fromLocationId: locked.currentLocationId,
          toWarehouseId: input.toWarehouseId,
          toLocationId: input.toLocationId,
          performedBy: userId,
          notes: input.notes,
        });
      }
    });

    return { transferred: input.cylinderIds.length };
  }

  /** Manual correction (§41 "use ADJUSTMENT instead of deleting"). */
  async adjustment(input: AdjustmentInput, userId: string) {
    const [existing] = await db.select().from(cylinders).where(eq(cylinders.id, input.cylinderId));
    if (!existing) throw new NotFoundException("Cylinder not found");
    // Only meaningful when the cylinder is actually sitting in a warehouse —
    // e.g. adjusting a cylinder currently WITH_CUSTOMER has no warehouse to check.
    if (existing.currentWarehouseId) {
      await this.warehouseAccessService.assertAccess(userId, existing.currentWarehouseId);
    }

    await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(cylinders)
        .where(eq(cylinders.id, input.cylinderId))
        .for("update");
      if (!current) throw new NotFoundException("Cylinder not found");

      await tx
        .update(cylinders)
        .set({
          availabilityStatus: input.availabilityStatus ?? current.availabilityStatus,
          conditionStatus: input.conditionStatus ?? current.conditionStatus,
          updatedAt: new Date(),
        })
        .where(eq(cylinders.id, input.cylinderId));

      await tx.insert(inventoryTransactions).values({
        cylinderId: input.cylinderId,
        transactionType: "ADJUSTMENT",
        conditionBefore: current.conditionStatus,
        conditionAfter: input.conditionStatus ?? current.conditionStatus,
        performedBy: userId,
        notes: input.notes,
      });
    });

    const [updated] = await db.select().from(cylinders).where(eq(cylinders.id, input.cylinderId));
    return updated;
  }
}
