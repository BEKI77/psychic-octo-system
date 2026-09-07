import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { PermissionCode } from "../../auth/permissions.js";
import { PERMISSIONS_KEY } from "./permissions.decorator.js";
import { RolesService } from "./roles.service.js";
import type { AuthenticatedRequest } from "./session.guard.js";

/** Run after SessionGuard: `@UseGuards(SessionGuard, PermissionsGuard)`. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionCode[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const granted = await this.rolesService.getPermissionCodesForUser(request.authUser.id);
    const missing = required.filter((code) => !granted.has(code));

    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permissions: ${missing.join(", ")}`);
    }
    return true;
  }
}
