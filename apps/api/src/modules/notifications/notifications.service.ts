/**
 * §46 Notifications — synchronous, database-backed, no Redis/BullMQ (the
 * design explicitly calls that out as unnecessary for MVP workloads). Every
 * `notify*` call here is fired from inside the domain action that produced
 * the event (see call sites in sales/returns/maintenance/approvals
 * services), wrapped so a notification failure never breaks the action
 * that triggered it — same defensive posture as AuditLogInterceptor.
 */
import { Injectable, Logger } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { notifications, permissions, rolePermissions, userRoles } from "../../database/schema/index.js";
import type { PermissionCode } from "../../auth/permissions.js";
import type { NotificationFilters } from "./notifications.schema.js";

interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async notify(input: NotifyInput) {
    try {
      await db.insert(notifications).values(input);
    } catch (err) {
      this.logger.error(`Failed to create notification (${input.type})`, err instanceof Error ? err.stack : err);
    }
  }

  /** Fans out to every user holding `permissionCode` — e.g. every manager who can review approvals. */
  async notifyByPermission(permissionCode: PermissionCode, input: Omit<NotifyInput, "userId">) {
    try {
      const recipients = await db
        .selectDistinct({ userId: userRoles.userId })
        .from(userRoles)
        .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(permissions.code, permissionCode));

      if (recipients.length === 0) return;
      await db.insert(notifications).values(recipients.map((r) => ({ ...input, userId: r.userId })));
    } catch (err) {
      this.logger.error(`Failed to fan out notification (${input.type})`, err instanceof Error ? err.stack : err);
    }
  }

  async findForUser(userId: string, filters: NotificationFilters) {
    const conditions = [eq(notifications.userId, userId)];
    if (filters.unreadOnly) conditions.push(eq(notifications.isRead, false));

    return db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: desc(notifications.createdAt),
      limit: filters.limit ?? 50,
    });
  }

  async unreadCount(userId: string) {
    const rows = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return rows.length;
  }

  /** Ownership-checked — a notification can only be marked read by its own recipient. */
  async markRead(id: string, userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }
}
