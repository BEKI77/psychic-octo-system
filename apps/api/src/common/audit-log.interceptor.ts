/**
 * §45 Audit Logging — global interceptor rather than hand-instrumented
 * per-service calls. Trade-off: it can only capture what's generically
 * derivable from the HTTP request/response —
 *
 *   - entityType/entityId/action come from the route path + method (see
 *     `deriveAuditMeta` below), not from domain knowledge of each module.
 *   - `newValues` is the JSON response body the handler actually returned
 *     (the post-mutation state, which is what every controller in this app
 *     already returns on success) rather than a hand-picked diff.
 *   - `oldValues` is left null — computing a real before/after diff would
 *     require querying each entity's table by id *before* the handler runs,
 *     which is exactly the per-entity wiring this approach avoids. If a
 *     specific workflow later needs field-level before/after (e.g. the
 *     design's condition GOOD -> DAMAGED example), that's better served by
 *     a targeted call to `recordAuditLog` from that one service, not by
 *     complicating this interceptor for every route.
 *
 * Only successful (2xx) mutating requests (POST/PATCH/PUT/DELETE) are
 * logged — reads never touch the audit log, and a failed mutation (4xx/5xx)
 * never wrote anything anyway. Logging failures are swallowed (console.error
 * only) so a broken insert never breaks the actual response.
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request } from "express";
import { Observable, tap } from "rxjs";
import { db } from "../database/db.js";
import { auditLogs } from "../database/schema/index.js";
import type { AuthenticatedRequest } from "../modules/auth/session.guard.js";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const REDACT_KEYS = new Set(["password", "passwordHash", "password_hash", "secret", "token"]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        REDACT_KEYS.has(key) ? "[REDACTED]" : redact(val),
      ]),
    );
  }
  return value;
}

/**
 * Derives {entityType, entityId, action} from the matched route path and
 * method, e.g.:
 *   POST   /api/v1/customers            -> customers,  -,  CREATE
 *   PATCH  /api/v1/customers/:id        -> customers, id,  UPDATE
 *   DELETE /api/v1/cylinders/:id        -> cylinders, id,  DELETE
 *   POST   /api/v1/receiving/:id/confirm -> receiving, id, CONFIRM
 *   POST   /api/v1/inventory/transfer    -> inventory, -,  TRANSFER
 */
function deriveAuditMeta(routePath: string, method: string, params: Record<string, string>) {
  const segments = routePath.split("/").filter(Boolean);
  const v1Index = segments.indexOf("v1");
  const resourceSegments = v1Index >= 0 ? segments.slice(v1Index + 1) : segments;

  const entityType = resourceSegments[0] ?? "unknown";
  const lastParamSegment = [...resourceSegments].reverse().find((segment) => segment.startsWith(":"));
  const entityId = lastParamSegment ? (params[lastParamSegment.slice(1)] ?? null) : null;

  const lastSegment = resourceSegments.at(-1);
  const trailingAction =
    lastSegment && !lastSegment.startsWith(":") && lastSegment !== entityType ? lastSegment : undefined;

  const action = trailingAction
    ? trailingAction.replace(/-/g, "_").toUpperCase()
    : { POST: "CREATE", PATCH: "UPDATE", PUT: "UPDATE", DELETE: "DELETE" }[method] ?? method;

  return { entityType, entityId, action };
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!MUTATING_METHODS.has(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        void this.record(request, responseBody);
      }),
    );
  }

  private async record(request: AuthenticatedRequest, responseBody: unknown) {
    try {
      const routePath: string = (request.route as { path?: string } | undefined)?.path ?? request.path;
      const { entityType, entityId, action } = deriveAuditMeta(
        routePath,
        request.method,
        (request.params as Record<string, string>) ?? {},
      );

      const newValues =
        responseBody && typeof responseBody === "object" ? redact(responseBody) : redact(request.body ?? null);

      await db.insert(auditLogs).values({
        userId: request.authUser?.id ?? null,
        action,
        entityType,
        entityId,
        newValues: newValues as object | null,
        ipAddress: request.ip ?? null,
        userAgent: request.get?.("user-agent") ?? null,
      });
    } catch (err) {
      console.error("AuditLogInterceptor: failed to record audit log entry", err);
    }
  }
}
