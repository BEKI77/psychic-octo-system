/**
 * §46 Notifications — deliberately no Redis/BullMQ/outbox (the design's own
 * guidance: "For low-volume MVP workloads, synchronous handling or a
 * lightweight database-backed job/outbox mechanism is sufficient"). Rows
 * are written synchronously, in-process, by NotificationsService from
 * inside the domain action that triggered them (credit override used,
 * cylinder damaged on return, repair completed, approval requested/decided)
 * — see notifications.service.ts. No Telegram/SMS/email delivery channel is
 * wired up here; this is the in-app notification only.
 */
import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./identity.schema.js";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: text().notNull(),
    title: text().notNull(),
    message: text().notNull(),

    entityType: text(),
    entityId: text(),

    isRead: boolean().notNull().default(false),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notifications_user_unread_idx").on(table.userId, table.isRead, table.createdAt)],
);
