/** §11 Receiving. */
import { sql } from "drizzle-orm";
import { date, pgEnum, pgSequence, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { suppliers } from "./supplier.schema.js";
import { warehouseLocations, warehouses } from "./warehouse.schema.js";
import { cylinderConditionEnum, cylinders } from "./cylinder.schema.js";
import { users } from "./identity.schema.js";

export const receiptNumberSeq = pgSequence("receipt_number_seq", { startWith: 1 });

export const receiptStatusEnum = pgEnum("receipt_status", [
  "DRAFT",
  "PENDING_APPROVAL",
  "RECEIVED",
  "CANCELLED",
]);

export const receipts = pgTable("receipts", {
  id: uuid().primaryKey().defaultRandom(),
  receiptNumber: text()
    .notNull()
    .unique()
    .default(sql`('RCPT-' || lpad(nextval('receipt_number_seq')::text, 6, '0'))`),
  supplierId: uuid()
    .notNull()
    .references(() => suppliers.id),
  warehouseId: uuid()
    .notNull()
    .references(() => warehouses.id),

  supplierReference: text(),
  receivedDate: date().notNull(),

  status: receiptStatusEnum().notNull().default("DRAFT"),
  notes: text(),

  createdBy: uuid()
    .notNull()
    .references(() => users.id),
  approvedBy: uuid().references(() => users.id),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const receiptItems = pgTable("receipt_items", {
  id: uuid().primaryKey().defaultRandom(),
  receiptId: uuid()
    .notNull()
    .references(() => receipts.id, { onDelete: "cascade" }),
  cylinderId: uuid()
    .notNull()
    .references(() => cylinders.id),
  // Where within the receiving warehouse this item lands once confirmed —
  // the warehouse itself comes from the parent receipt.
  locationId: uuid().references(() => warehouseLocations.id),
  conditionStatus: cylinderConditionEnum().notNull().default("GOOD"),
  notes: text(),
});
