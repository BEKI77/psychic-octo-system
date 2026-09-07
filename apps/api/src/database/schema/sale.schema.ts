/**
 * §15 Sales / Cylinder Issues. Draft → items → confirm, mirroring the
 * Receiving workflow (§11) rather than §43's single-shot example request —
 * consistent with the rest of the app and still atomic/row-locked at
 * confirm time (§42).
 */
import { sql } from "drizzle-orm";
import { date, numeric, pgEnum, pgSequence, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { customers } from "./customer.schema.js";
import { warehouses } from "./warehouse.schema.js";
import { cylinders } from "./cylinder.schema.js";
import { users } from "./identity.schema.js";

export const saleNumberSeq = pgSequence("sale_number_seq", { startWith: 1 });

export const saleStatusEnum = pgEnum("sale_status", ["DRAFT", "CONFIRMED", "CANCELLED"]);

export const salePaymentStatusEnum = pgEnum("sale_payment_status", [
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
  "OVERPAID",
]);

const money = () => numeric({ precision: 12, scale: 2, mode: "number" });

export const sales = pgTable("sales", {
  id: uuid().primaryKey().defaultRandom(),
  saleNumber: text()
    .notNull()
    .unique()
    .default(sql`('SALE-' || lpad(nextval('sale_number_seq')::text, 6, '0'))`),

  customerId: uuid()
    .notNull()
    .references(() => customers.id),
  warehouseId: uuid()
    .notNull()
    .references(() => warehouses.id),

  saleDate: date().notNull(),

  subtotal: money().notNull().default(0),
  discount: money().notNull().default(0),
  tax: money().notNull().default(0),
  total: money().notNull().default(0),

  paidAmount: money().notNull().default(0),
  outstandingAmount: money().notNull().default(0),
  paymentStatus: salePaymentStatusEnum().notNull().default("UNPAID"),

  status: saleStatusEnum().notNull().default("DRAFT"),

  createdBy: uuid()
    .notNull()
    .references(() => users.id),
  approvedBy: uuid().references(() => users.id),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id: uuid().primaryKey().defaultRandom(),
  saleId: uuid()
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  cylinderId: uuid()
    .notNull()
    .references(() => cylinders.id),

  unitPrice: money().notNull(),
  discount: money().notNull().default(0),
  subtotal: money().notNull(),
});
