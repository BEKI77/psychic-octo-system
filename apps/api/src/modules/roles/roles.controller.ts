import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { createRoleSchema, updateRoleSchema } from "./roles.schema.js";
import { RolesAdminService } from "./roles.service.js";

@Controller("v1")
@UseGuards(SessionGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesAdminService: RolesAdminService) {}

  @Get("permissions")
  @RequirePermissions("USER_VIEW")
  listPermissions() {
    return this.rolesAdminService.listPermissions();
  }

  @Get("roles")
  @RequirePermissions("USER_VIEW")
  findAll() {
    return this.rolesAdminService.findAllRoles();
  }

  @Get("roles/:id")
  @RequirePermissions("USER_VIEW")
  findOne(@Param("id") id: string) {
    return this.rolesAdminService.findOneRole(id);
  }

  @Post("roles")
  @RequirePermissions("ROLE_MANAGE")
  create(@Body(new ZodValidationPipe(createRoleSchema)) body: ReturnType<typeof createRoleSchema.parse>) {
    return this.rolesAdminService.create(body);
  }

  @Patch("roles/:id")
  @RequirePermissions("ROLE_MANAGE")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateRoleSchema)) body: ReturnType<typeof updateRoleSchema.parse>,
  ) {
    return this.rolesAdminService.update(id, body);
  }

  @Delete("roles/:id")
  @RequirePermissions("ROLE_MANAGE")
  remove(@Param("id") id: string) {
    return this.rolesAdminService.remove(id);
  }
}
