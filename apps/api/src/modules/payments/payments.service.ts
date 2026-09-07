import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { customers, paymentAllocations, payments, sales } from "../../database/schema/index.js";
import { recordLedgerEntry } from "../customers/customer-ledger.util.js";
import { paymentStatusFor } from "../sales/payment-status.util.js";
import type { AllocatePaymentInput, CreatePaymentInput } from "./payments.schema.js";

const WITH_RELATIONS = {
  customer: { columns: { id: true, customerCode: true, name: true } },
  receivedByUser: { columns: { id: true, username: true } },
  allocations: {
    with: { sale: { columns: { id: true, saleNumber: true, total: true, outstandingAmount: true } } },
  },
} as const;

function withUnallocated<T extends { amount: number; allocations: { allocatedAmount: number }[] }>(payment: T) {
  const allocated = payment.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  return { ...payment, unallocatedAmount: payment.amount - allocated };
}

@Injectable()
export class PaymentsService {
  async findAll(customerId?: string) {
    const rows = await db.query.payments.findMany({
      where: customerId ? eq(payments.customerId, customerId) : undefined,
      with: WITH_RELATIONS,
      orderBy: desc(payments.createdAt),
    });
    return rows.map(withUnallocated);
  }

  async findOne(id: string) {
    const payment = await db.query.payments.findFirst({ where: eq(payments.id, id), with: WITH_RELATIONS });
    if (!payment) throw new NotFoundException("Payment not found");
    return withUnallocated(payment);
  }

  /**
   * §17 Payments. Recorded against the customer immediately (reduces their
   * ledger balance right away) — which sale(s) it pays down is a separate
   * step (§18 allocate), matching how unapplied cash works in practice.
   */
  async create(input: CreatePaymentInput, userId: string) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, input.customerId));
    if (!customer) throw new NotFoundException("Customer not found");

    const payment = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(payments)
        .values({
          customerId: input.customerId,
          amount: input.amount,
          paymentMethod: input.method,
          paymentDate: input.paymentDate,
          referenceNumber: input.referenceNumber,
          notes: input.notes,
          receivedBy: userId,
        })
        .returning();

      await recordLedgerEntry(tx, {
        customerId: input.customerId,
        transactionType: "PAYMENT",
        credit: input.amount,
        referenceType: "PAYMENT",
        referenceId: created.id,
        notes: `Payment ${created.paymentNumber}`,
        userId,
      });

      return created;
    });

    return this.findOne(payment.id);
  }

  /** §18 Payment Allocation — splits this payment across one or more outstanding sales. */
  async allocate(id: string, input: AllocatePaymentInput) {
    const payment = await this.findOne(id);
    if (payment.status !== "COMPLETED") throw new ConflictException(`Payment is ${payment.status}`);

    const requested = input.allocations.reduce((sum, a) => sum + a.amount, 0);
    if (requested > payment.unallocatedAmount) {
      throw new ConflictException(
        `Only ${payment.unallocatedAmount} of this payment is unallocated, but ${requested} was requested`,
      );
    }

    await db.transaction(async (tx) => {
      for (const allocation of input.allocations) {
        const [sale] = await tx.select().from(sales).where(eq(sales.id, allocation.saleId)).for("update");
        if (!sale) throw new NotFoundException(`Sale ${allocation.saleId} not found`);
        if (sale.customerId !== payment.customerId) {
          throw new ConflictException("This sale does not belong to the payment's customer");
        }
        if (sale.status !== "CONFIRMED") {
          throw new ConflictException(`Sale ${sale.saleNumber} is ${sale.status}, not CONFIRMED`);
        }

        await tx.insert(paymentAllocations).values({
          paymentId: id,
          saleId: sale.id,
          allocatedAmount: allocation.amount,
        });

        const paidAmount = sale.paidAmount + allocation.amount;
        const outstandingAmount = sale.total - paidAmount;
        await tx
          .update(sales)
          .set({
            paidAmount,
            outstandingAmount,
            paymentStatus: paymentStatusFor(paidAmount, sale.total),
            updatedAt: new Date(),
          })
          .where(eq(sales.id, sale.id));
      }
    });

    return this.findOne(id);
  }

  /**
   * §41 "never delete completed financial transactions" — voiding reverses
   * every sale this payment was allocated to, records an offsetting
   * DEBIT_NOTE for the full amount (the ledger credit from creation is
   * never edited), and marks the payment VOIDED rather than deleting it.
   */
  async void(id: string, userId: string) {
    const payment = await this.findOne(id);
    if (payment.status === "VOIDED") throw new ConflictException("Payment is already voided");

    await db.transaction(async (tx) => {
      for (const allocation of payment.allocations) {
        const [sale] = await tx.select().from(sales).where(eq(sales.id, allocation.saleId)).for("update");
        if (!sale) continue;

        const paidAmount = sale.paidAmount - allocation.allocatedAmount;
        const outstandingAmount = sale.total - paidAmount;
        await tx
          .update(sales)
          .set({
            paidAmount,
            outstandingAmount,
            paymentStatus: paymentStatusFor(paidAmount, sale.total),
            updatedAt: new Date(),
          })
          .where(eq(sales.id, sale.id));
      }

      await recordLedgerEntry(tx, {
        customerId: payment.customerId,
        transactionType: "DEBIT_NOTE",
        debit: payment.amount,
        referenceType: "PAYMENT",
        referenceId: payment.id,
        notes: `Voided payment ${payment.paymentNumber}`,
        userId,
      });

      await tx.update(payments).set({ status: "VOIDED" }).where(eq(payments.id, id));
    });

    return this.findOne(id);
  }
}
