/**
 * §20 Returns + §21 Partial Returns + §22 Return Inspection. Adding a
 * cylinder to a return (`POST /returns/:id/items`) *is* the physical
 * receiving action (§31's API list has no separate "receive" endpoint) —
 * it immediately moves the cylinder off the customer and into
 * NEEDS_INSPECTION, auto-advancing the return DRAFT -> RECEIVED. Removing
 * an item (or cancelling before inspection) reverses that.
 */
import { sql } from "drizzle-orm";
import {
  date,
  integer,
  numeric,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./customer.schema.js";
import { warehouses } from "./warehouse.schema.js";
import { cylinderConditionEnum, cylinders } from "./cylinder.schema.js";
import { saleItems } from "./sale.schema.js";
import { users } from "./identity.schema.js";

export const returnNumberSeq = pgSequence("return_number_seq", { startWith: 1 });

export const returnStatusEnum = pgEnum("return_status", [
  "DRAFT",
  "RECEIVED",
  "INSPECTED",
  "COMPLETED",
  "CANCELLED",
]);

export const inspectionResultEnum = pgEnum("inspection_result", ["GOOD", "DAMAGED", "NEEDS_REPAIR"]);

export const returns = pgTable("returns", {
  id: uuid().primaryKey().defaultRandom(),
  returnNumber: text()
    .notNull()
    .unique()
    .default(sql`('RET-' || lpad(nextval('return_number_seq')::text, 6, '0'))`),

  customerId: uuid()
    .notNull()
    .references(() => customers.id),
  warehouseId: uuid()
    .notNull()
    .references(() => warehouses.id),

  returnDate: date().notNull(),
  status: returnStatusEnum().notNull().default("DRAFT"),
  totalItems: integer().notNull().default(0),
  notes: text(),

  receivedBy: uuid()
    .notNull()
    .references(() => users.id),
  approvedBy: uuid().references(() => users.id),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const returnItems = pgTable("return_items", {
  id: uuid().primaryKey().defaultRandom(),
  returnId: uuid()
    .notNull()
    .references(() => returns.id, { onDelete: "cascade" }),
  saleItemId: uuid()
    .notNull()
    .references(() => saleItems.id),
  cylinderId: uuid()
    .notNull()
    .references(() => cylinders.id),

  conditionAtReturn: cylinderConditionEnum().notNull(),
  inspectionResult: inspectionResultEnum(),
  financialAdjustment: numeric({ precision: 12, scale: 2, mode: "number" }),
  notes: text(),
});
