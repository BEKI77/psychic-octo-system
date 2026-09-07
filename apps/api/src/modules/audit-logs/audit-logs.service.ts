import { Injectable } from "@nestjs/common";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "../../database/db.js";
import { auditLogs } from "../../database/schema/index.js";
import type { AuditLogFilters } from "./audit-logs.schema.js";

@Injectable()
export class AuditLogsService {
  /** §45 Audit Logging — append-only, read via filters; rows are written by AuditLogInterceptor. */
  async findAll(filters: AuditLogFilters) {
    const conditions: SQL[] = [];
    if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters.entityId) conditions.push(eq(auditLogs.entityId, filters.entityId));
    if (filters.userId) conditions.push(eq(auditLogs.userId, filters.userId));
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.from) conditions.push(gte(auditLogs.createdAt, new Date(filters.from)));
    if (filters.to) conditions.push(lte(auditLogs.createdAt, new Date(`${filters.to}T23:59:59.999Z`)));

    return db.query.auditLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { user: { columns: { id: true, username: true, firstName: true, lastName: true } } },
      orderBy: desc(auditLogs.createdAt),
      limit: filters.limit ?? 50,
      offset: filters.offset ?? 0,
    });
  }
}
