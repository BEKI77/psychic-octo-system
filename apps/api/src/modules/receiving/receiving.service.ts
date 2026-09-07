import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import {
  cylinders,
  inventoryTransactions,
  receiptItems,
  receipts,
  suppliers,
  warehouses,
} from "../../database/schema/index.js";
import { CylindersService } from "../cylinders/cylinders.service.js";
import { WarehouseAccessService } from "../auth/warehouse-access.service.js";
import type { AddReceiptItemInput, CreateReceiptInput, UpdateReceiptInput } from "./receiving.schema.js";

const WITH_RELATIONS = {
  supplier: true,
  warehouse: true,
  createdByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
  approvedByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
  items: { with: { cylinder: { with: { cylinderType: true } }, location: true } },
} as const;

@Injectable()
export class ReceivingService {
  constructor(
    private readonly cylindersService: CylindersService,
    private readonly warehouseAccessService: WarehouseAccessService,
  ) {}

  findAll() {
    return db.query.receipts.findMany({
      with: WITH_RELATIONS,
      orderBy: desc(receipts.createdAt),
    });
  }

  async findOne(id: string) {
    const receipt = await db.query.receipts.findFirst({
      where: eq(receipts.id, id),
      with: WITH_RELATIONS,
    });
    if (!receipt) throw new NotFoundException("Receipt not found");
    return receipt;
  }

  private async assertDraft(id: string) {
    const receipt = await this.findOne(id);
    if (receipt.status !== "DRAFT") {
      throw new ConflictException("Only draft receipts can be modified");
    }
    return receipt;
  }

  async create(input: CreateReceiptInput, userId: string) {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, input.supplierId));
    if (!supplier) throw new NotFoundException("Supplier not found");
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, input.warehouseId));
    if (!warehouse) throw new NotFoundException("Warehouse not found");
    await this.warehouseAccessService.assertAccess(userId, input.warehouseId);

    const [receipt] = await db
      .insert(receipts)
      .values({ ...input, createdBy: userId })
      .returning();
    return this.findOne(receipt.id);
  }

  async update(id: string, input: UpdateReceiptInput) {
    await this.assertDraft(id);
    await db
      .update(receipts)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(receipts.id, id));
    return this.findOne(id);
  }

  async addItem(receiptId: string, input: AddReceiptItemInput) {
    const receipt = await this.assertDraft(receiptId);

    let cylinderId: string;
    if (input.newCylinder) {
      const cylinder = await this.cylindersService.create(input.newCylinder);
      cylinderId = cylinder.id;
    } else {
      const [cylinder] = await db.select().from(cylinders).where(eq(cylinders.id, input.cylinderId!));
      if (!cylinder) throw new NotFoundException("Cylinder not found");
      if (cylinder.availabilityStatus === "WITH_CUSTOMER" || cylinder.availabilityStatus === "SCRAPPED") {
        throw new ConflictException(
          `Cylinder ${cylinder.internalCode} cannot be received: it is currently ${cylinder.availabilityStatus}`,
        );
      }
      cylinderId = cylinder.id;
    }

    const [item] = await db
      .insert(receiptItems)
      .values({
        receiptId: receipt.id,
        cylinderId,
        locationId: input.locationId,
        conditionStatus: input.conditionStatus,
        notes: input.notes,
      })
      .returning();
    return item;
  }

  async removeItem(receiptId: string, itemId: string) {
    await this.assertDraft(receiptId);
    const [item] = await db.select().from(receiptItems).where(eq(receiptItems.id, itemId));
    if (!item || item.receiptId !== receiptId) throw new NotFoundException("Receipt item not found");
    await db.delete(receiptItems).where(eq(receiptItems.id, itemId));
  }

  /**
   * Confirms the receipt: moves every item's cylinder into the receiving
   * warehouse and writes a RECEIVE inventory transaction for each, all in
   * one DB transaction with row-level locks (§42 Database Transaction
   * Safety) so two workers can't confirm overlapping receipts for the same
   * cylinder concurrently.
   */
  async confirm(receiptId: string, userId: string) {
    const receipt = await this.findOne(receiptId);
    if (receipt.status !== "DRAFT" && receipt.status !== "PENDING_APPROVAL") {
      throw new ConflictException(`Receipt is already ${receipt.status}`);
    }
    if (receipt.items.length === 0) {
      throw new BadRequestException("Cannot confirm a receipt with no items");
    }

    await db.transaction(async (tx) => {
      for (const item of receipt.items) {
        const [locked] = await tx
          .select()
          .from(cylinders)
          .where(eq(cylinders.id, item.cylinderId))
          .for("update");

        if (locked.availabilityStatus === "WITH_CUSTOMER" || locked.availabilityStatus === "SCRAPPED") {
          throw new ConflictException(
            `Cylinder ${locked.internalCode} cannot be received: it is currently ${locked.availabilityStatus}`,
          );
        }

        await tx
          .update(cylinders)
          .set({
            currentWarehouseId: receipt.warehouseId,
            currentLocationId: item.locationId,
            availabilityStatus: "AVAILABLE",
            conditionStatus: item.conditionStatus,
            updatedAt: new Date(),
          })
          .where(eq(cylinders.id, item.cylinderId));

        await tx.insert(inventoryTransactions).values({
          cylinderId: item.cylinderId,
          transactionType: "RECEIVE",
          toWarehouseId: receipt.warehouseId,
          toLocationId: item.locationId,
          referenceType: "RECEIPT",
          referenceId: receipt.id,
          conditionBefore: locked.conditionStatus,
          conditionAfter: item.conditionStatus,
          performedBy: userId,
          notes: item.notes,
        });
      }

      await tx
        .update(receipts)
        .set({ status: "RECEIVED", approvedBy: userId, updatedAt: new Date() })
        .where(eq(receipts.id, receiptId));
    });

    return this.findOne(receiptId);
  }

  async cancel(id: string) {
    const receipt = await this.findOne(id);
    if (receipt.status !== "DRAFT" && receipt.status !== "PENDING_APPROVAL") {
      throw new ConflictException(`Receipt is already ${receipt.status}`);
    }
    await db.update(receipts).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(receipts.id, id));
    return this.findOne(id);
  }
}
