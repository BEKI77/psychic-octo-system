/** §13 Customers. */
import { boolean, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const customerTypeEnum = pgEnum("customer_type", [
  "INDIVIDUAL",
  "BUSINESS",
  "WHOLESALE",
  "DISTRIBUTOR",
  "RETAIL",
]);

export const customerStatusEnum = pgEnum("customer_status", ["ACTIVE", "INACTIVE", "BLOCKED"]);

export const customers = pgTable("customers", {
  id: uuid().primaryKey().defaultRandom(),
  customerCode: text().notNull().unique(),
  name: text().notNull(),
  customerType: customerTypeEnum().notNull().default("INDIVIDUAL"),
  phone: text(),
  email: text(),
  address: text(),
  taxNumber: text(),

  // §40 Credit Management. currentCredit/availableCredit are computed from
  // sales.outstandingAmount (see CustomersService), not stored — Phase 6
  // adds the customer_ledger table this could later be reconciled against.
  creditLimit: numeric({ precision: 12, scale: 2, mode: "number" }).notNull().default(0),
  creditEnabled: boolean().notNull().default(false),

  status: customerStatusEnum().notNull().default("ACTIVE"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
