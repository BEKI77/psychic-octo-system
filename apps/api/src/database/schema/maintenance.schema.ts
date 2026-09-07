/** §23 Maintenance. */
import { sql } from "drizzle-orm";
import { numeric, pgEnum, pgSequence, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { cylinders } from "./cylinder.schema.js";
import { users } from "./identity.schema.js";

export const maintenanceNumberSeq = pgSequence("maintenance_number_seq", { startWith: 1 });

export const maintenanceTypeEnum = pgEnum("maintenance_type", ["REPAIR", "OTHER"]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "REPORTED",
  "IN_REPAIR",
  "COMPLETED",
  "CANCELLED",
]);

export const maintenanceRecords = pgTable("maintenance_records", {
  id: uuid().primaryKey().defaultRandom(),
  maintenanceNumber: text()
    .notNull()
    .unique()
    .default(sql`('MNT-' || lpad(nextval('maintenance_number_seq')::text, 6, '0'))`),

  cylinderId: uuid()
    .notNull()
    .references(() => cylinders.id),

  maintenanceType: maintenanceTypeEnum().notNull().default("REPAIR"),
  description: text(),

  reportedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp({ withTimezone: true }),
  completedAt: timestamp({ withTimezone: true }),

  cost: numeric({ precision: 12, scale: 2, mode: "number" }),

  status: maintenanceStatusEnum().notNull().default("REPORTED"),

  performedBy: uuid().references(() => users.id),
  approvedBy: uuid().references(() => users.id),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
