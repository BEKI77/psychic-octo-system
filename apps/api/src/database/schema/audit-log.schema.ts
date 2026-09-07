/**
 * §45 Audit Logging — append-only. Populated generically by a global
 * interceptor (src/common/audit-log.interceptor.ts) for every successful
 * mutating request, rather than hand-instrumented per service — see that
 * file's comment for what that trades off.
 */
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./identity.schema.js";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().references(() => users.id),

    action: text().notNull(),
    entityType: text().notNull(),
    entityId: text(),

    oldValues: jsonb(),
    newValues: jsonb(),

    ipAddress: text(),
    userAgent: text(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);
