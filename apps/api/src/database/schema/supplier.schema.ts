/** §10 Suppliers. */
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const suppliers = pgTable("suppliers", {
  id: uuid().primaryKey().defaultRandom(),
  code: text().notNull().unique(),
  name: text().notNull(),
  phone: text(),
  email: text(),
  address: text(),
  taxNumber: text(),
  contactPerson: text(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
