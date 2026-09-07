/**
 * §66 Phase 8 Multiple Warehouses — which warehouse(s) a user may transact
 * at (create receipts/sales/returns, transfer, adjust). A user with zero
 * rows here is unrestricted (every pre-Phase-8 seeded user, including the
 * bootstrap admin) — this is opt-in scoping, not a default lockdown; see
 * WarehouseAccessService.assertAccess in modules/auth.
 */
import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { users } from "./identity.schema.js";
import { warehouses } from "./warehouse.schema.js";

export const userWarehouses = pgTable(
  "user_warehouses",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    warehouseId: uuid()
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.warehouseId] })],
);
