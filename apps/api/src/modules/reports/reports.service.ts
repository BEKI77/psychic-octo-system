import { Injectable } from "@nestjs/common";
import { and, count, desc, eq, gt, gte, lte, sql } from "drizzle-orm";
import { db } from "../../database/db.js";
import { customers, cylinderTypes, cylinders, payments, sales } from "../../database/schema/index.js";
import type { DateRangeFilter } from "./reports.schema.js";

@Injectable()
export class ReportsService {
  /** §50 Credit Aging — buckets each confirmed sale's outstanding balance by days since sale date. */
  async creditAging() {
    return db
      .select({
        customerId: customers.id,
        customerCode: customers.customerCode,
        customerName: customers.name,
        bucket0to30: sql<number>`coalesce(sum(case when current_date - ${sales.saleDate} <= 30 then ${sales.outstandingAmount} else 0 end), 0)::float`,
        bucket31to60: sql<number>`coalesce(sum(case when current_date - ${sales.saleDate} between 31 and 60 then ${sales.outstandingAmount} else 0 end), 0)::float`,
        bucket61to90: sql<number>`coalesce(sum(case when current_date - ${sales.saleDate} between 61 and 90 then ${sales.outstandingAmount} else 0 end), 0)::float`,
        bucket90plus: sql<number>`coalesce(sum(case when current_date - ${sales.saleDate} > 90 then ${sales.outstandingAmount} else 0 end), 0)::float`,
        total: sql<number>`coalesce(sum(${sales.outstandingAmount}), 0)::float`,
      })
      .from(sales)
      .innerJoin(customers, eq(sales.customerId, customers.id))
      .where(and(eq(sales.status, "CONFIRMED"), gt(sales.outstandingAmount, 0)))
      .groupBy(customers.id, customers.customerCode, customers.name)
      .orderBy(desc(sql`sum(${sales.outstandingAmount})`));
  }

  /** Current amount owed per customer (same computation as CustomersService.getCredit, across all customers). */
  async customerBalances() {
    return db
      .select({
        customerId: customers.id,
        customerCode: customers.customerCode,
        customerName: customers.name,
        creditLimit: customers.creditLimit,
        creditEnabled: customers.creditEnabled,
        balance: sql<number>`coalesce(sum(${sales.outstandingAmount}), 0)::float`,
      })
      .from(customers)
      .leftJoin(sales, and(eq(sales.customerId, customers.id), eq(sales.status, "CONFIRMED")))
      .groupBy(customers.id, customers.customerCode, customers.name, customers.creditLimit, customers.creditEnabled)
      .having(sql`coalesce(sum(${sales.outstandingAmount}), 0) > 0`)
      .orderBy(desc(sql`coalesce(sum(${sales.outstandingAmount}), 0)`));
  }

  async salesReport(filters: DateRangeFilter) {
    const conditions = [eq(sales.status, "CONFIRMED")];
    if (filters.from) conditions.push(gte(sales.saleDate, filters.from));
    if (filters.to) conditions.push(lte(sales.saleDate, filters.to));
    if (filters.customerId) conditions.push(eq(sales.customerId, filters.customerId));

    const [summary] = await db
      .select({
        count: count(),
        subtotal: sql<number>`coalesce(sum(${sales.subtotal}), 0)::float`,
        discount: sql<number>`coalesce(sum(${sales.discount}), 0)::float`,
        tax: sql<number>`coalesce(sum(${sales.tax}), 0)::float`,
        total: sql<number>`coalesce(sum(${sales.total}), 0)::float`,
        paidAmount: sql<number>`coalesce(sum(${sales.paidAmount}), 0)::float`,
        outstandingAmount: sql<number>`coalesce(sum(${sales.outstandingAmount}), 0)::float`,
      })
      .from(sales)
      .where(and(...conditions));

    const byDay = await db
      .select({
        day: sql<string>`${sales.saleDate}::text`,
        count: count(),
        total: sql<number>`coalesce(sum(${sales.total}), 0)::float`,
      })
      .from(sales)
      .where(and(...conditions))
      .groupBy(sales.saleDate)
      .orderBy(sales.saleDate);

    return { summary, byDay };
  }

  async paymentsReport(filters: DateRangeFilter) {
    const conditions = [eq(payments.status, "COMPLETED")];
    if (filters.from) conditions.push(gte(payments.paymentDate, filters.from));
    if (filters.to) conditions.push(lte(payments.paymentDate, filters.to));
    if (filters.customerId) conditions.push(eq(payments.customerId, filters.customerId));

    const [summary] = await db
      .select({ count: count(), totalAmount: sql<number>`coalesce(sum(${payments.amount}), 0)::float` })
      .from(payments)
      .where(and(...conditions));

    const byMethod = await db
      .select({
        method: payments.paymentMethod,
        count: count(),
        total: sql<number>`coalesce(sum(${payments.amount}), 0)::float`,
      })
      .from(payments)
      .where(and(...conditions))
      .groupBy(payments.paymentMethod);

    return { summary, byMethod };
  }

  /** §50 Inventory Report — per cylinder type: Total | Available | Customer | Repair | Damaged. */
  async inventoryReport() {
    return db
      .select({
        cylinderTypeId: cylinderTypes.id,
        cylinderTypeCode: cylinderTypes.code,
        cylinderTypeName: cylinderTypes.name,
        total: count(),
        available: sql<number>`count(*) filter (where ${cylinders.availabilityStatus} = 'AVAILABLE')::int`,
        customer: sql<number>`count(*) filter (where ${cylinders.availabilityStatus} = 'WITH_CUSTOMER')::int`,
        repair: sql<number>`count(*) filter (where ${cylinders.conditionStatus} = 'UNDER_REPAIR')::int`,
        damaged: sql<number>`count(*) filter (where ${cylinders.conditionStatus} = 'DAMAGED')::int`,
      })
      .from(cylinders)
      .innerJoin(cylinderTypes, eq(cylinders.cylinderTypeId, cylinderTypes.id))
      .groupBy(cylinderTypes.id, cylinderTypes.code, cylinderTypes.name)
      .orderBy(cylinderTypes.code);
  }

  /**
   * §50 Cylinder Accountability — Total = Warehouse + Customers + Repair +
   * Inspection + Scrap. Each bucket below is a strict priority slice over
   * the two independent status enums (§9) so together they partition every
   * cylinder exactly once — the five figures always add up to `total`,
   * which the frontend can verify rather than trust:
   *   1. Scrap      — availability OR condition is SCRAPPED (highest priority)
   *   2. Customers   — WITH_CUSTOMER (and not already counted as scrap)
   *   3. Repair      — condition UNDER_REPAIR (and not customer/scrap)
   *   4. Inspection  — condition NEEDS_INSPECTION (and not customer/scrap)
   *   5. Warehouse   — everything left over
   */
  async cylinderAccountability() {
    const [row] = await db
      .select({
        total: count(),
        warehouse: sql<number>`count(*) filter (where ${cylinders.availabilityStatus} not in ('SCRAPPED','WITH_CUSTOMER') and ${cylinders.conditionStatus} not in ('UNDER_REPAIR','NEEDS_INSPECTION','SCRAPPED'))::int`,
        customers: sql<number>`count(*) filter (where ${cylinders.availabilityStatus} = 'WITH_CUSTOMER' and ${cylinders.conditionStatus} != 'SCRAPPED')::int`,
        repair: sql<number>`count(*) filter (where ${cylinders.conditionStatus} = 'UNDER_REPAIR' and ${cylinders.availabilityStatus} not in ('SCRAPPED','WITH_CUSTOMER'))::int`,
        inspection: sql<number>`count(*) filter (where ${cylinders.conditionStatus} = 'NEEDS_INSPECTION' and ${cylinders.availabilityStatus} not in ('SCRAPPED','WITH_CUSTOMER'))::int`,
        scrap: sql<number>`count(*) filter (where ${cylinders.availabilityStatus} = 'SCRAPPED' or ${cylinders.conditionStatus} = 'SCRAPPED')::int`,
      })
      .from(cylinders);
    return row;
  }
}
