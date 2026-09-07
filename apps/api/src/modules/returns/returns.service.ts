import { BadRequestException, ConflictException, Injectable, NotFoundException, type OnModuleInit } from "@nestjs/common";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../../database/db.js";
import {
  customers,
  cylinders,
  inventoryTransactions,
  maintenanceRecords,
  returnItems,
  returns,
  saleItems,
  sales,
  warehouses,
} from "../../database/schema/index.js";
import { paymentStatusFor } from "../sales/payment-status.util.js";
import { recordLedgerEntry } from "../customers/customer-ledger.util.js";
import { RolesService } from "../auth/roles.service.js";
import { WarehouseAccessService } from "../auth/warehouse-access.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { ApprovalsService } from "../approvals/approvals.service.js";
import type { AddReturnItemInput, CreateReturnInput, InspectReturnInput, ReturnsFilter } from "./returns.schema.js";

/**
 * §46 "Large return" alert / §66 Approvals. A return whose total financial
 * adjustment exceeds this is held at INSPECTED (nothing applied to the
 * sale yet) and routed through the approval queue instead of completing
 * immediately — unless the person completing it already holds
 * APPROVAL_REVIEW themselves, in which case there's no one else to ask.
 * No settings table exists yet to make this admin-configurable; a fixed
 * constant is the honest MVP scope here.
 */
const LARGE_RETURN_THRESHOLD = 10_000;

const WITH_RELATIONS = {
  customer: true,
  warehouse: true,
  receivedByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
  approvedByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
  items: {
    with: {
      cylinder: { with: { cylinderType: true } },
      saleItem: { with: { sale: { columns: { id: true, saleNumber: true } } } },
    },
  },
} as const;

const CONDITION_FOR_RESULT = {
  GOOD: "GOOD",
  DAMAGED: "DAMAGED",
  NEEDS_REPAIR: "UNDER_REPAIR",
} as const;

const TRANSACTION_FOR_RESULT = {
  GOOD: "INSPECTION",
  DAMAGED: "DAMAGE",
  NEEDS_REPAIR: "REPAIR_START",
} as const;

@Injectable()
export class ReturnsService implements OnModuleInit {
  constructor(
    private readonly rolesService: RolesService,
    private readonly warehouseAccessService: WarehouseAccessService,
    private readonly notificationsService: NotificationsService,
    private readonly approvalsService: ApprovalsService,
  ) {}

  /** Registers the "LARGE_RETURN" approval handler — see approvals.service.ts's class comment. */
  onModuleInit() {
    this.approvalsService.registerHandler("LARGE_RETURN", (entityId, approverId) =>
      this.completeInternal(entityId, approverId),
    );
  }

  findAll(filters: ReturnsFilter = {}) {
    const conditions = [];
    if (filters.customerId) conditions.push(eq(returns.customerId, filters.customerId));
    if (filters.status) conditions.push(eq(returns.status, filters.status));

    return db.query.returns.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: WITH_RELATIONS,
      orderBy: (table, { desc }) => desc(table.createdAt),
    });
  }

  async findOne(id: string) {
    const record = await db.query.returns.findFirst({ where: eq(returns.id, id), with: WITH_RELATIONS });
    if (!record) throw new NotFoundException("Return not found");

    // Surfaced so the frontend can show "awaiting manager approval" without
    // needing APPROVAL_REVIEW itself just to check this one return's status.
    const pendingApproval = await this.approvalsService.findPendingFor("LARGE_RETURN", "returns", id);
    return { ...record, pendingApproval: pendingApproval ?? null };
  }

  async create(input: CreateReturnInput, userId: string) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, input.customerId));
    if (!customer) throw new NotFoundException("Customer not found");
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, input.warehouseId));
    if (!warehouse) throw new NotFoundException("Warehouse not found");
    await this.warehouseAccessService.assertAccess(userId, input.warehouseId);

    const [record] = await db
      .insert(returns)
      .values({ ...input, receivedBy: userId })
      .returning();
    return this.findOne(record.id);
  }

  /**
   * Adding an item *is* the physical receiving action (§31's API has no
   * separate "receive" endpoint) — it immediately moves the cylinder off
   * the customer into NEEDS_INSPECTION and auto-advances DRAFT -> RECEIVED.
   */
  async addItem(returnId: string, input: AddReturnItemInput, userId: string) {
    const record = await this.findOne(returnId);
    if (record.status !== "DRAFT" && record.status !== "RECEIVED") {
      throw new ConflictException(`Return is already ${record.status}`);
    }

    const saleItem = await db.query.saleItems.findFirst({
      where: eq(saleItems.id, input.saleItemId),
      with: { sale: true },
    });
    if (!saleItem) throw new NotFoundException("Sale item not found");
    if (saleItem.sale.customerId !== record.customerId || saleItem.sale.status !== "CONFIRMED") {
      throw new ConflictException("This sale item was not issued to this customer");
    }

    const [alreadyReturned] = await db
      .select({ id: returnItems.id })
      .from(returnItems)
      .innerJoin(returns, eq(returns.id, returnItems.returnId))
      .where(and(eq(returnItems.saleItemId, input.saleItemId), ne(returns.status, "CANCELLED")));
    if (alreadyReturned) throw new ConflictException("This cylinder has already been returned");

    const item = await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(cylinders)
        .where(eq(cylinders.id, saleItem.cylinderId))
        .for("update");
      if (!locked) throw new NotFoundException("Cylinder not found");

      // §41 Return validation.
      if (locked.availabilityStatus !== "WITH_CUSTOMER") {
        throw new ConflictException(`Cylinder ${locked.internalCode} is not currently with a customer`);
      }
      if (locked.currentCustomerId !== record.customerId && !input.overrideOwnership) {
        throw new ConflictException(
          `Cylinder ${locked.internalCode} is held by a different customer — pass overrideOwnership to force this`,
        );
      }

      await tx
        .update(cylinders)
        .set({
          availabilityStatus: "AVAILABLE",
          conditionStatus: "NEEDS_INSPECTION",
          currentCustomerId: null,
          currentWarehouseId: record.warehouseId,
          currentLocationId: input.locationId,
          updatedAt: new Date(),
        })
        .where(eq(cylinders.id, saleItem.cylinderId));

      await tx.insert(inventoryTransactions).values({
        cylinderId: saleItem.cylinderId,
        transactionType: "RETURN",
        fromCustomerId: record.customerId,
        toWarehouseId: record.warehouseId,
        toLocationId: input.locationId,
        referenceType: "RETURN",
        referenceId: record.id,
        conditionBefore: input.conditionAtReturn,
        conditionAfter: "NEEDS_INSPECTION",
        performedBy: userId,
        notes: input.overrideOwnership ? `Ownership override. ${input.notes ?? ""}`.trim() : input.notes,
      });

      const [created] = await tx
        .insert(returnItems)
        .values({
          returnId: record.id,
          saleItemId: input.saleItemId,
          cylinderId: saleItem.cylinderId,
          conditionAtReturn: input.conditionAtReturn,
          notes: input.notes,
        })
        .returning();

      await tx
        .update(returns)
        .set({ totalItems: record.totalItems + 1, status: "RECEIVED", updatedAt: new Date() })
        .where(eq(returns.id, record.id));

      return created;
    });

    return item;
  }

  /** Undoes addItem — puts the cylinder back with the customer. */
  async removeItem(returnId: string, itemId: string, userId: string) {
    const record = await this.findOne(returnId);
    if (record.status !== "RECEIVED") {
      throw new ConflictException("Items can only be removed before inspection");
    }
    const item = record.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException("Return item not found");

    await db.transaction(async (tx) => {
      const [locked] = await tx.select().from(cylinders).where(eq(cylinders.id, item.cylinderId)).for("update");

      await tx
        .update(cylinders)
        .set({
          availabilityStatus: "WITH_CUSTOMER",
          conditionStatus: "GOOD",
          currentCustomerId: record.customerId,
          currentWarehouseId: null,
          currentLocationId: null,
          updatedAt: new Date(),
        })
        .where(eq(cylinders.id, item.cylinderId));

      await tx.insert(inventoryTransactions).values({
        cylinderId: item.cylinderId,
        transactionType: "ADJUSTMENT",
        toCustomerId: record.customerId,
        conditionBefore: locked?.conditionStatus,
        conditionAfter: "GOOD",
        referenceType: "RETURN",
        referenceId: record.id,
        performedBy: userId,
        notes: "Return item removed (correction) — cylinder restored to customer",
      });

      await tx.delete(returnItems).where(eq(returnItems.id, itemId));

      const totalItems = record.totalItems - 1;
      await tx
        .update(returns)
        .set({ totalItems, status: totalItems > 0 ? "RECEIVED" : "DRAFT", updatedAt: new Date() })
        .where(eq(returns.id, record.id));
    });
  }

  /**
   * §22 Return Inspection. Every received item must be inspected in one
   * call. GOOD -> reissuable; DAMAGED -> held, not issuable; NEEDS_REPAIR ->
   * opens a maintenance record (§23) and holds the cylinder until repaired.
   */
  async inspect(returnId: string, input: InspectReturnInput, userId: string) {
    const record = await this.findOne(returnId);
    if (record.status !== "RECEIVED") throw new ConflictException(`Return is ${record.status}, not RECEIVED`);

    const itemIds = new Set(record.items.map((i) => i.id));
    const inputIds = new Set(input.items.map((i) => i.itemId));
    if (itemIds.size !== inputIds.size || [...itemIds].some((id) => !inputIds.has(id))) {
      throw new BadRequestException("Every received item must be inspected in the same request");
    }

    await db.transaction(async (tx) => {
      for (const entry of input.items) {
        const item = record.items.find((i) => i.id === entry.itemId)!;
        const [locked] = await tx.select().from(cylinders).where(eq(cylinders.id, item.cylinderId)).for("update");

        const newCondition = CONDITION_FOR_RESULT[entry.inspectionResult];
        await tx
          .update(cylinders)
          .set({ conditionStatus: newCondition, updatedAt: new Date() })
          .where(eq(cylinders.id, item.cylinderId));

        await tx.insert(inventoryTransactions).values({
          cylinderId: item.cylinderId,
          transactionType: TRANSACTION_FOR_RESULT[entry.inspectionResult],
          conditionBefore: locked?.conditionStatus,
          conditionAfter: newCondition,
          referenceType: "RETURN",
          referenceId: record.id,
          performedBy: userId,
          notes: entry.notes,
        });

        if (entry.inspectionResult === "NEEDS_REPAIR") {
          await tx.insert(maintenanceRecords).values({
            cylinderId: item.cylinderId,
            maintenanceType: "REPAIR",
            description: entry.notes ?? `Reported via return ${record.returnNumber}`,
          });
        }

        const financialAdjustment = entry.financialAdjustment ?? item.saleItem.subtotal;
        await tx
          .update(returnItems)
          .set({ inspectionResult: entry.inspectionResult, financialAdjustment, notes: entry.notes })
          .where(eq(returnItems.id, entry.itemId));
      }

      await tx.update(returns).set({ status: "INSPECTED", updatedAt: new Date() }).where(eq(returns.id, returnId));
    });

    // §46 "Cylinder marked damaged" — one summary notification per inspect
    // call rather than per item, so a 20-cylinder return doesn't spam.
    const damagedCount = input.items.filter((i) => i.inspectionResult === "DAMAGED").length;
    const repairCount = input.items.filter((i) => i.inspectionResult === "NEEDS_REPAIR").length;
    if (damagedCount + repairCount > 0) {
      await this.notificationsService.notifyByPermission("MAINTENANCE_MANAGE", {
        type: "CYLINDER_DAMAGED",
        title: "Cylinders need attention",
        message: `Return ${record.returnNumber}: ${damagedCount} damaged, ${repairCount} sent for repair.`,
        entityType: "returns",
        entityId: returnId,
      });
    }

    return this.findOne(returnId);
  }

  /**
   * Applies each item's financial adjustment against the sale it came
   * from. Gated by an approval request when the total exceeds
   * LARGE_RETURN_THRESHOLD and the caller isn't themselves an approver —
   * see the class-level comment and ApprovalsService.
   */
  async complete(returnId: string, userId: string) {
    const record = await this.findOne(returnId);
    if (record.status !== "INSPECTED") throw new ConflictException(`Return is ${record.status}, not INSPECTED`);

    const totalAdjustment = record.items.reduce((sum, item) => sum + (item.financialAdjustment ?? 0), 0);
    if (totalAdjustment > LARGE_RETURN_THRESHOLD) {
      const granted = await this.rolesService.getPermissionCodesForUser(userId);
      if (!granted.has("APPROVAL_REVIEW")) {
        const approval = await this.approvalsService.create({
          type: "LARGE_RETURN",
          entityType: "returns",
          entityId: returnId,
          requestedBy: userId,
          reason: `Return ${record.returnNumber} totals ${totalAdjustment} — exceeds the ${LARGE_RETURN_THRESHOLD} auto-approval threshold`,
          payload: { returnNumber: record.returnNumber, totalAdjustment, customerId: record.customerId },
        });
        return { ...record, pendingApproval: approval };
      }
    }

    return this.completeInternal(returnId, userId);
  }

  /** The actual completion logic — called directly for small returns, or by the approval handler once granted. */
  private async completeInternal(returnId: string, userId: string) {
    const record = await this.findOne(returnId);
    if (record.status !== "INSPECTED") throw new ConflictException(`Return is ${record.status}, not INSPECTED`);

    const adjustmentsBySale = new Map<string, number>();
    for (const item of record.items) {
      const saleId = item.saleItem.saleId;
      adjustmentsBySale.set(saleId, (adjustmentsBySale.get(saleId) ?? 0) + (item.financialAdjustment ?? 0));
    }

    await db.transaction(async (tx) => {
      for (const [saleId, adjustment] of adjustmentsBySale) {
        const [sale] = await tx.select().from(sales).where(eq(sales.id, saleId)).for("update");
        if (!sale) continue;

        const total = Math.max(sale.total - adjustment, 0);
        const outstandingAmount = total - sale.paidAmount;
        await tx
          .update(sales)
          .set({
            total,
            outstandingAmount,
            paymentStatus: paymentStatusFor(sale.paidAmount, total),
            updatedAt: new Date(),
          })
          .where(eq(sales.id, saleId));

        if (adjustment > 0) {
          await recordLedgerEntry(tx, {
            customerId: record.customerId,
            transactionType: "RETURN",
            credit: adjustment,
            referenceType: "RETURN",
            referenceId: record.id,
            notes: `Return ${record.returnNumber} against ${sale.saleNumber}`,
            userId,
          });
        }
      }

      await tx
        .update(returns)
        .set({ status: "COMPLETED", approvedBy: userId, updatedAt: new Date() })
        .where(eq(returns.id, returnId));
    });

    return this.findOne(returnId);
  }

  async cancel(returnId: string, userId: string) {
    const record = await this.findOne(returnId);
    if (record.status !== "DRAFT" && record.status !== "RECEIVED") {
      throw new ConflictException("Only a return that hasn't been inspected yet can be cancelled");
    }

    await db.transaction(async (tx) => {
      for (const item of record.items) {
        await tx
          .update(cylinders)
          .set({
            availabilityStatus: "WITH_CUSTOMER",
            conditionStatus: "GOOD",
            currentCustomerId: record.customerId,
            currentWarehouseId: null,
            currentLocationId: null,
            updatedAt: new Date(),
          })
          .where(eq(cylinders.id, item.cylinderId));

        await tx.insert(inventoryTransactions).values({
          cylinderId: item.cylinderId,
          transactionType: "ADJUSTMENT",
          toCustomerId: record.customerId,
          conditionAfter: "GOOD",
          referenceType: "RETURN",
          referenceId: record.id,
          performedBy: userId,
          notes: "Return cancelled — cylinder restored to customer",
        });
      }

      await tx.update(returns).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(returns.id, returnId));
    });

    return this.findOne(returnId);
  }
}
