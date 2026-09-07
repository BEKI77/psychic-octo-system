/**
 * §66 Phase 8 Approvals — a generic pending-approval queue, decoupled from
 * any one domain module's state machine (see approvals.service.ts's
 * registerHandler comment for why). `type` is a free-form string rather
 * than a closed pg enum (like audit_logs.entityType) so a new approval kind
 * never needs a migration — only the corresponding handler registration.
 */
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./identity.schema.js";

export const approvalStatusEnum = pgEnum("approval_status", ["PENDING", "APPROVED", "REJECTED"]);

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid().primaryKey().defaultRandom(),

    type: text().notNull(),
    entityType: text().notNull(),
    entityId: text().notNull(),

    status: approvalStatusEnum().notNull().default("PENDING"),
    reason: text(),
    payload: jsonb(),

    requestedBy: uuid()
      .notNull()
      .references(() => users.id),
    reviewedBy: uuid().references(() => users.id),
    reviewNotes: text(),
    reviewedAt: timestamp({ withTimezone: true }),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("approval_requests_status_idx").on(table.status),
    index("approval_requests_entity_idx").on(table.entityType, table.entityId),
  ],
);
