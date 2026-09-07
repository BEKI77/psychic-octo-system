import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard, type SessionResult } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { approvalFiltersSchema, decideApprovalSchema } from "./approvals.schema.js";
import { ApprovalsService } from "./approvals.service.js";

@Controller("v1/approvals")
@UseGuards(SessionGuard, PermissionsGuard)
@RequirePermissions("APPROVAL_REVIEW")
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(approvalFiltersSchema)) filters: ReturnType<typeof approvalFiltersSchema.parse>,
  ) {
    return this.approvalsService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.approvalsService.findOne(id);
  }

  @Post(":id/approve")
  approve(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(decideApprovalSchema)) body: ReturnType<typeof decideApprovalSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.approvalsService.approve(id, user.id, body.reviewNotes);
  }

  @Post(":id/reject")
  reject(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(decideApprovalSchema)) body: ReturnType<typeof decideApprovalSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.approvalsService.reject(id, user.id, body.reviewNotes);
  }
}
