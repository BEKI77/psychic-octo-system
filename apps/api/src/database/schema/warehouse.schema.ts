/** §7 Warehouse Management. */
import {
  type AnyPgColumn,
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const locationTypeEnum = pgEnum("location_type", [
  "ZONE",
  "RACK",
  "AREA",
  "REPAIR",
  "INSPECTION",
  "DISPATCH",
  "SCRAP",
]);

export const warehouses = pgTable("warehouses", {
  id: uuid().primaryKey().defaultRandom(),
  code: text().notNull().unique(),
  name: text().notNull(),
  address: text(),
  phone: text(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const warehouseLocations = pgTable(
  "warehouse_locations",
  {
    id: uuid().primaryKey().defaultRandom(),
    warehouseId: uuid()
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    // Self-reference (§7.2 example: WH-001 -> Z-A -> R-A1). The explicit
    // AnyPgColumn return type is required for Drizzle's lazy self-reference.
    parentId: uuid().references((): AnyPgColumn => warehouseLocations.id),
    code: text().notNull(),
    name: text().notNull(),
    locationType: locationTypeEnum().notNull(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("warehouse_locations_warehouse_code_idx").on(table.warehouseId, table.code)],
);
