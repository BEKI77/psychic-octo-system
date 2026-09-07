/**
 * §12 Inventory Transactions — "the heart of physical inventory tracking".
 * Append-only: never update or delete a row here (§41 "never delete
 * completed inventory or financial transactions" — use ADJUSTMENT instead).
 */
import { sql } from "drizzle-orm";
import { index, pgEnum, pgSequence, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { cylinderConditionEnum, cylinders } from "./cylinder.schema.js";
import { warehouseLocations, warehouses } from "./warehouse.schema.js";
import { users } from "./identity.schema.js";
import { customers } from "./customer.schema.js";

export const transactionNumberSeq = pgSequence("transaction_number_seq", { startWith: 1 });

export const transactionTypeEnum = pgEnum("inventory_transaction_type", [
  "RECEIVE",
  "ISSUE",
  "RETURN",
  "TRANSFER",
  "MOVE",
  "INSPECTION",
  "REPAIR_START",
  "REPAIR_COMPLETE",
  "DAMAGE",
  "SCRAP",
  "ADJUSTMENT",
]);

export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: uuid().primaryKey().defaultRandom(),
    transactionNumber: text()
      .notNull()
      .unique()
      .default(sql`('TXN-' || lpad(nextval('transaction_number_seq')::text, 6, '0'))`),

    cylinderId: uuid()
      .notNull()
      .references(() => cylinders.id),

    transactionType: transactionTypeEnum().notNull(),

    fromWarehouseId: uuid().references(() => warehouses.id),
    fromLocationId: uuid().references(() => warehouseLocations.id),
    fromCustomerId: uuid().references(() => customers.id),

    toWarehouseId: uuid().references(() => warehouses.id),
    toLocationId: uuid().references(() => warehouseLocations.id),
    toCustomerId: uuid().references(() => customers.id),

    // Loosely-typed pointer back to whatever business document caused this
    // transaction (receipts now; sales/returns/maintenance records later) —
    // deliberately not a FK since it can reference different tables.
    referenceType: text(),
    referenceId: uuid(),

    conditionBefore: cylinderConditionEnum(),
    conditionAfter: cylinderConditionEnum(),

    performedBy: uuid()
      .notNull()
      .references(() => users.id),
    transactionDate: timestamp({ withTimezone: true }).notNull().defaultNow(),

    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("inventory_transactions_cylinder_id_idx").on(table.cylinderId),
    index("inventory_transactions_reference_idx").on(table.referenceType, table.referenceId),
    index("inventory_transactions_type_date_idx").on(table.transactionType, table.transactionDate),
  ],
);
