/**
 * §9 Cylinders — the core individually-identifiable inventory unit (§65 Key
 * Design Decision: this is not a quantity-only inventory system).
 *
 * Availability and condition are deliberately separate enums (§9 "Do not
 * combine availability and condition into one huge status enum" — a
 * cylinder can be AVAILABLE + UNDER_REPAIR at once, meaning it physically
 * exists but can't be issued). Phase 2 only registers/edits cylinders as
 * master data; the state-machine *enforcement* of which transitions are
 * legal is §66 Phase 3 ("Inventory State Machine"), wired up alongside the
 * receiving/issue/return actions that actually drive those transitions.
 */
import { date, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { warehouseLocations, warehouses } from "./warehouse.schema.js";
import { cylinderTypes } from "./cylinder-type.schema.js";
import { customers } from "./customer.schema.js";

export const cylinderAvailabilityEnum = pgEnum("cylinder_availability_status", [
  "AVAILABLE",
  "RESERVED",
  "WITH_CUSTOMER",
  "IN_TRANSIT",
  "BLOCKED",
  "SCRAPPED",
]);

export const cylinderConditionEnum = pgEnum("cylinder_condition_status", [
  "GOOD",
  "DAMAGED",
  "NEEDS_INSPECTION",
  "UNDER_REPAIR",
  "REPAIRED",
  "SCRAPPED",
]);

export const cylinders = pgTable("cylinders", {
  id: uuid().primaryKey().defaultRandom(),
  cylinderTypeId: uuid()
    .notNull()
    .references(() => cylinderTypes.id),

  internalCode: text().notNull().unique(),
  serialNumber: text().notNull().unique(),
  qrCode: text().unique(),
  barcode: text().unique(),

  manufactureDate: date(),
  purchaseDate: date(),

  availabilityStatus: cylinderAvailabilityEnum().notNull().default("AVAILABLE"),
  conditionStatus: cylinderConditionEnum().notNull().default("GOOD"),

  currentWarehouseId: uuid().references(() => warehouses.id),
  currentLocationId: uuid().references(() => warehouseLocations.id),
  currentCustomerId: uuid().references(() => customers.id),

  lastInspectionAt: timestamp({ withTimezone: true }),
  nextInspectionAt: timestamp({ withTimezone: true }),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
