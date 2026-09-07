/**
 * §17 Payments + §18 Payment Allocation. Phase 4 only ever creates one
 * allocation per payment (against the sale it was collected for, at
 * confirm time) — the flexible multi-invoice allocation *feature*
 * (splitting one payment across many outstanding sales, §18's example) is
 * §66 Phase 6 ("Payment Allocation"); the join table exists now so that
 * later feature doesn't need a schema migration to bolt itself on.
 */
import { sql } from "drizzle-orm";
import { date, numeric, pgEnum, pgSequence, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { customers } from "./customer.schema.js";
import { sales } from "./sale.schema.js";
import { users } from "./identity.schema.js";

export const paymentNumberSeq = pgSequence("payment_number_seq", { startWith: 1 });

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "BANK_TRANSFER",
  "MOBILE_MONEY",
  "CARD",
  "OTHER",
]);

export const paymentStatusEnum = pgEnum("payment_status", ["COMPLETED", "VOIDED"]);

export const payments = pgTable("payments", {
  id: uuid().primaryKey().defaultRandom(),
  paymentNumber: text()
    .notNull()
    .unique()
    .default(sql`('PAY-' || lpad(nextval('payment_number_seq')::text, 6, '0'))`),

  customerId: uuid()
    .notNull()
    .references(() => customers.id),

  amount: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
  paymentMethod: paymentMethodEnum().notNull(),
  paymentDate: date().notNull(),

  referenceNumber: text(),
  notes: text(),

  status: paymentStatusEnum().notNull().default("COMPLETED"),

  receivedBy: uuid()
    .notNull()
    .references(() => users.id),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const paymentAllocations = pgTable("payment_allocations", {
  id: uuid().primaryKey().defaultRandom(),
  paymentId: uuid()
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  saleId: uuid()
    .notNull()
    .references(() => sales.id),
  allocatedAmount: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
