import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { auth } from "../../auth/auth.js";

/** Derived from the live `auth` instance so additionalFields stay in sync automatically. */
export type SessionResult = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export interface AuthenticatedRequest extends Request {
  authUser: SessionResult["user"];
  authSession: SessionResult["session"];
}

/**
 * Validates the Better Auth session cookie for the current request.
 * Business authorization (RBAC) is a separate concern — see PermissionsGuard.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const result = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!result) {
      throw new UnauthorizedException("Not authenticated");
    }
    if (result.user.isActive === false) {
      throw new UnauthorizedException("Account is deactivated");
    }

    request.authUser = result.user;
    request.authSession = result.session;
    return true;
  }
}
