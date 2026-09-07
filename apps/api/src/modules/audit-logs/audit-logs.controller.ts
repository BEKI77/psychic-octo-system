import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { auditLogFiltersSchema } from "./audit-logs.schema.js";
import { AuditLogsService } from "./audit-logs.service.js";

@Controller("v1/audit-logs")
@UseGuards(SessionGuard, PermissionsGuard)
@RequirePermissions("AUDIT_LOG_VIEW")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(@Query(new ZodValidationPipe(auditLogFiltersSchema)) filters: ReturnType<typeof auditLogFiltersSchema.parse>) {
    return this.auditLogsService.findAll(filters);
  }
}
