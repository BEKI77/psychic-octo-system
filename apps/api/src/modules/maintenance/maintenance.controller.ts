import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard, type SessionResult } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import {
  completeMaintenanceSchema,
  createMaintenanceSchema,
  maintenanceFilterSchema,
} from "./maintenance.schema.js";
import { MaintenanceService } from "./maintenance.service.js";

@Controller("v1/maintenance")
@UseGuards(SessionGuard, PermissionsGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @RequirePermissions("CYLINDER_VIEW")
  findAll(
    @Query(new ZodValidationPipe(maintenanceFilterSchema)) filters: ReturnType<typeof maintenanceFilterSchema.parse>,
  ) {
    return this.maintenanceService.findAll(filters);
  }

  @Get(":id")
  @RequirePermissions("CYLINDER_VIEW")
  findOne(@Param("id") id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  @RequirePermissions("MAINTENANCE_MANAGE")
  create(
    @Body(new ZodValidationPipe(createMaintenanceSchema)) body: ReturnType<typeof createMaintenanceSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.maintenanceService.create(body, user.id);
  }

  @Post(":id/start")
  @RequirePermissions("MAINTENANCE_MANAGE")
  start(@Param("id") id: string, @CurrentUser() user: SessionResult["user"]) {
    return this.maintenanceService.start(id, user.id);
  }

  @Post(":id/complete")
  @RequirePermissions("MAINTENANCE_MANAGE")
  complete(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(completeMaintenanceSchema)) body: ReturnType<typeof completeMaintenanceSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.maintenanceService.complete(id, body, user.id);
  }

  @Post(":id/cancel")
  @RequirePermissions("MAINTENANCE_MANAGE")
  cancel(@Param("id") id: string) {
    return this.maintenanceService.cancel(id);
  }
}
