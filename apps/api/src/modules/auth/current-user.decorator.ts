import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest } from "./session.guard.js";

/** Use after `@UseGuards(SessionGuard)`: `@CurrentUser() user: SessionResult['user']`. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.authUser;
});
