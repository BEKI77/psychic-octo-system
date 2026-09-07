import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../../database/db.js";
import { customerLedger, customers, inventoryTransactions, sales } from "../../database/schema/index.js";
import type { CreateCustomerInput, UpdateCustomerInput } from "./customers.schema.js";

@Injectable()
export class CustomersService {
  findAll() {
    return db.select().from(customers).orderBy(asc(customers.name));
  }

  async findOne(id: string) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    if (!customer) throw new NotFoundException("Customer not found");
    return customer;
  }

  async create(input: CreateCustomerInput) {
    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.customerCode, input.customerCode));
    if (existing) throw new ConflictException("A customer with this code already exists");

    const [customer] = await db.insert(customers).values(input).returning();
    return customer;
  }

  async update(id: string, input: UpdateCustomerInput) {
    await this.findOne(id);
    const [customer] = await db
      .update(customers)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  /**
   * §40 Credit Management. Computed from sales.outstandingAmount rather
   * than the customer_ledger's running balance — see the schema comment on
   * customer_ledger for why: it's the authoritative *current state* (§2.2)
   * that Phases 4-5 already maintain, and switching this to the ledger
   * would need a backfill of pre-Phase-6 sales that don't have ledger
   * entries.
   */
  async getCredit(id: string) {
    const customer = await this.findOne(id);
    const [{ currentCredit }] = await db
      .select({ currentCredit: sql<number>`coalesce(sum(${sales.outstandingAmount}), 0)::float` })
      .from(sales)
      .where(and(eq(sales.customerId, id), eq(sales.status, "CONFIRMED")));

    return {
      creditLimit: customer.creditLimit,
      creditEnabled: customer.creditEnabled,
      currentCredit,
      availableCredit: customer.creditEnabled ? customer.creditLimit - currentCredit : 0,
    };
  }

  async getCylinders(id: string) {
    await this.findOne(id);
    return db.query.cylinders.findMany({
      where: (table, { eq }) => eq(table.currentCustomerId, id),
      with: { cylinderType: true, currentWarehouse: true, currentLocation: true },
    });
  }

  async getTransactions(id: string) {
    await this.findOne(id);
    return db.query.inventoryTransactions.findMany({
      where: or(eq(inventoryTransactions.fromCustomerId, id), eq(inventoryTransactions.toCustomerId, id)),
      with: {
        cylinder: { columns: { id: true, internalCode: true, serialNumber: true } },
        performedByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
      },
      orderBy: desc(inventoryTransactions.transactionDate),
    });
  }

  /** §19 Customer Ledger — the append-only financial history (see schema comment). */
  async getLedger(id: string) {
    await this.findOne(id);
    return db.query.customerLedger.findMany({
      where: eq(customerLedger.customerId, id),
      with: { createdByUser: { columns: { id: true, username: true } } },
      orderBy: desc(customerLedger.transactionDate),
    });
  }
}
