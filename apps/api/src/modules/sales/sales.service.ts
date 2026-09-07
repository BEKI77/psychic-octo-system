import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import {
  cylinders,
  inventoryTransactions,
  paymentAllocations,
  payments,
  saleItems,
  sales,
} from "../../database/schema/index.js";
import { CustomersService } from "../customers/customers.service.js";
import { recordLedgerEntry } from "../customers/customer-ledger.util.js";
import { RolesService } from "../auth/roles.service.js";
import { WarehouseAccessService } from "../auth/warehouse-access.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { paymentStatusFor } from "./payment-status.util.js";
import type { AddSaleItemInput, ConfirmSaleInput, CreateSaleInput, SalesFilter } from "./sales.schema.js";

const WITH_RELATIONS = {
  customer: true,
  warehouse: true,
  createdByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
  approvedByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
  items: { with: { cylinder: { with: { cylinderType: true } } } },
  paymentAllocations: { with: { payment: true } },
} as const;

@Injectable()
export class SalesService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly rolesService: RolesService,
    private readonly warehouseAccessService: WarehouseAccessService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(filters: SalesFilter = {}) {
    const conditions = [];
    if (filters.customerId) conditions.push(eq(sales.customerId, filters.customerId));
    if (filters.status) conditions.push(eq(sales.status, filters.status));

    return db.query.sales.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: WITH_RELATIONS,
      orderBy: desc(sales.createdAt),
    });
  }

  async findOne(id: string) {
    const sale = await db.query.sales.findFirst({ where: eq(sales.id, id), with: WITH_RELATIONS });
    if (!sale) throw new NotFoundException("Sale not found");
    return sale;
  }

  private async assertDraft(id: string) {
    const sale = await this.findOne(id);
    if (sale.status !== "DRAFT") throw new ConflictException("Only draft sales can be modified");
    return sale;
  }

  async create(input: CreateSaleInput, userId: string) {
    const customer = await this.customersService.findOne(input.customerId);
    if (customer.status !== "ACTIVE") {
      throw new ConflictException(`Customer is ${customer.status.toLowerCase()} and cannot be issued cylinders`);
    }
    await this.warehouseAccessService.assertAccess(userId, input.warehouseId);

    const [sale] = await db
      .insert(sales)
      .values({ ...input, createdBy: userId })
      .returning();
    return this.findOne(sale.id);
  }

  async cancel(id: string) {
    await this.assertDraft(id);
    await db.update(sales).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(sales.id, id));
    return this.findOne(id);
  }

  /** Adds a cylinder to a draft sale. Re-validated under lock at confirm(). */
  async addItem(saleId: string, input: AddSaleItemInput) {
    await this.assertDraft(saleId);

    const cylinder = await db.query.cylinders.findFirst({
      where: eq(cylinders.id, input.cylinderId),
      with: { cylinderType: true },
    });
    if (!cylinder) throw new NotFoundException("Cylinder not found");

    // §41 Cylinder issue validation.
    if (cylinder.availabilityStatus !== "AVAILABLE" || cylinder.conditionStatus !== "GOOD") {
      throw new ConflictException(
        `Cylinder ${cylinder.internalCode} cannot be issued: availability=${cylinder.availabilityStatus}, condition=${cylinder.conditionStatus}`,
      );
    }

    const unitPrice = input.unitPrice ?? cylinder.cylinderType.defaultPrice;
    if (unitPrice == null) {
      throw new BadRequestException(
        "This cylinder type has no default price — provide unitPrice explicitly",
      );
    }
    const discount = input.discount ?? 0;

    const [item] = await db
      .insert(saleItems)
      .values({ saleId, cylinderId: cylinder.id, unitPrice, discount, subtotal: unitPrice - discount })
      .returning();
    return item;
  }

  async removeItem(saleId: string, itemId: string) {
    await this.assertDraft(saleId);
    const [item] = await db.select().from(saleItems).where(eq(saleItems.id, itemId));
    if (!item || item.saleId !== saleId) throw new NotFoundException("Sale item not found");
    await db.delete(saleItems).where(eq(saleItems.id, itemId));
  }

  /**
   * Confirms the sale: re-validates and locks every item's cylinder (§42),
   * moves it to WITH_CUSTOMER, writes an ISSUE transaction, enforces the
   * credit limit (§40/§41), and records the accompanying payment if any.
   */
  async confirm(saleId: string, input: ConfirmSaleInput, userId: string) {
    const sale = await this.findOne(saleId);
    if (sale.status !== "DRAFT") throw new ConflictException(`Sale is already ${sale.status}`);
    if (sale.items.length === 0) throw new BadRequestException("Cannot confirm a sale with no items");

    const itemsSubtotal = sale.items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = input.discount ?? 0;
    const tax = input.tax ?? 0;
    const total = itemsSubtotal - discount + tax;
    const paidAmount = input.payment?.amount ?? 0;
    const outstandingAmount = total - paidAmount;
    let creditOverrideUsed = false;

    if (outstandingAmount > 0) {
      const customer = sale.customer;
      const credit = await this.customersService.getCredit(customer.id);
      const wouldExceedLimit =
        !customer.creditEnabled || credit.currentCredit + outstandingAmount > customer.creditLimit;

      if (wouldExceedLimit) {
        const granted = await this.rolesService.getPermissionCodesForUser(userId);
        if (!input.overrideCredit || !granted.has("CREDIT_APPROVE")) {
          throw new ConflictException(
            customer.creditEnabled
              ? `Credit limit exceeded: ${credit.availableCredit} available, ${outstandingAmount} requested`
              : "Customer is not enabled for credit — full payment is required",
          );
        }
        creditOverrideUsed = true;
      }
    }

    await db.transaction(async (tx) => {
      for (const item of sale.items) {
        const [locked] = await tx
          .select()
          .from(cylinders)
          .where(eq(cylinders.id, item.cylinderId))
          .for("update");

        if (locked.availabilityStatus !== "AVAILABLE" || locked.conditionStatus !== "GOOD") {
          throw new ConflictException(
            `Cylinder ${locked.internalCode} cannot be issued: availability=${locked.availabilityStatus}, condition=${locked.conditionStatus}`,
          );
        }

        await tx
          .update(cylinders)
          .set({
            availabilityStatus: "WITH_CUSTOMER",
            currentCustomerId: sale.customerId,
            currentWarehouseId: null,
            currentLocationId: null,
            updatedAt: new Date(),
          })
          .where(eq(cylinders.id, item.cylinderId));

        await tx.insert(inventoryTransactions).values({
          cylinderId: item.cylinderId,
          transactionType: "ISSUE",
          fromWarehouseId: locked.currentWarehouseId,
          fromLocationId: locked.currentLocationId,
          toCustomerId: sale.customerId,
          referenceType: "SALE",
          referenceId: sale.id,
          conditionBefore: locked.conditionStatus,
          conditionAfter: locked.conditionStatus,
          performedBy: userId,
        });
      }

      await tx
        .update(sales)
        .set({
          subtotal: itemsSubtotal,
          discount,
          tax,
          total,
          paidAmount,
          outstandingAmount,
          paymentStatus: paymentStatusFor(paidAmount, total),
          status: "CONFIRMED",
          approvedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(sales.id, saleId));

      await recordLedgerEntry(tx, {
        customerId: sale.customerId,
        transactionType: "SALE",
        debit: total,
        referenceType: "SALE",
        referenceId: sale.id,
        notes: `Sale ${sale.saleNumber}`,
        userId,
      });

      if (input.payment) {
        const [payment] = await tx
          .insert(payments)
          .values({
            customerId: sale.customerId,
            amount: input.payment.amount,
            paymentMethod: input.payment.method,
            paymentDate: sale.saleDate,
            referenceNumber: input.payment.referenceNumber,
            notes: input.payment.notes,
            receivedBy: userId,
          })
          .returning();

        await tx.insert(paymentAllocations).values({
          paymentId: payment.id,
          saleId: sale.id,
          allocatedAmount: input.payment.amount,
        });

        await recordLedgerEntry(tx, {
          customerId: sale.customerId,
          transactionType: "PAYMENT",
          credit: input.payment.amount,
          referenceType: "PAYMENT",
          referenceId: payment.id,
          notes: `Payment for ${sale.saleNumber}`,
          userId,
        });
      }
    });

    if (creditOverrideUsed) {
      // §46 "Credit limit exceeded" — fired for the override that actually
      // went through, not the blocked (409) attempt, which persisted nothing.
      await this.notificationsService.notifyByPermission("CREDIT_APPROVE", {
        type: "CREDIT_LIMIT_EXCEEDED",
        title: "Credit limit override used",
        message: `Sale ${sale.saleNumber} for ${sale.customer.name} was confirmed over the customer's credit limit.`,
        entityType: "sales",
        entityId: saleId,
      });
    }

    return this.findOne(saleId);
  }
}
