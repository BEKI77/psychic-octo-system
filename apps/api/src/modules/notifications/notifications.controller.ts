import { Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SessionGuard, type SessionResult } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { notificationFiltersSchema } from "./notifications.schema.js";
import { NotificationsService } from "./notifications.service.js";

/** No @RequirePermissions here — every authenticated user manages their own notifications. */
@Controller("v1/notifications")
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(notificationFiltersSchema))
    filters: ReturnType<typeof notificationFiltersSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.notificationsService.findForUser(user.id, filters);
  }

  @Get("unread-count")
  unreadCount(@CurrentUser() user: SessionResult["user"]) {
    return this.notificationsService.unreadCount(user.id);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: SessionResult["user"]) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: SessionResult["user"]) {
    return this.notificationsService.markAllRead(user.id);
  }
}
