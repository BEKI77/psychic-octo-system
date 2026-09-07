import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "./current-user.decorator.js";
import { RolesService } from "./roles.service.js";
import { SessionGuard, type SessionResult } from "./session.guard.js";
import { WarehouseAccessService } from "./warehouse-access.service.js";

/**
 * Login/logout/register are handled by Better Auth's own raw handler,
 * mounted at /api/auth/* in main.ts (per the design's authentication
 * boundary: Better Auth owns identity/sessions). This controller only adds
 * the one convenience endpoint the frontend needs on top of that: "who am I
 * and what can I do", combining the session user with their RBAC permissions.
 */
@Controller("v1/auth")
export class AuthController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly warehouseAccessService: WarehouseAccessService,
  ) {}

  @UseGuards(SessionGuard)
  @Get("me")
  async me(@CurrentUser() user: SessionResult["user"]) {
    const permissions = await this.rolesService.getPermissionCodesForUser(user.id);
    const assignedWarehouseIds = await this.warehouseAccessService.getAssignedWarehouseIds(user.id);
    return { user, permissions: [...permissions], assignedWarehouseIds };
  }
}
