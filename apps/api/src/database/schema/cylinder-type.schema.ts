/** §8 Cylinder Types — new sizes/brands without a schema change. */
import { boolean, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const cylinderTypes = pgTable("cylinder_types", {
  id: uuid().primaryKey().defaultRandom(),
  code: text().notNull().unique(),
  name: text().notNull(),
  capacityKg: numeric({ precision: 6, scale: 2, mode: "number" }).notNull(),
  brand: text(),
  description: text(),
  depositAmount: numeric({ precision: 12, scale: 2, mode: "number" }),
  defaultPrice: numeric({ precision: 12, scale: 2, mode: "number" }),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
