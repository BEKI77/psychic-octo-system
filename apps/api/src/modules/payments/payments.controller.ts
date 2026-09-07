import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard, type SessionResult } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { allocatePaymentSchema, createPaymentSchema, paymentsFilterSchema } from "./payments.schema.js";
import { PaymentsService } from "./payments.service.js";

@Controller("v1/payments")
@UseGuards(SessionGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions("CUSTOMER_VIEW")
  findAll(
    @Query(new ZodValidationPipe(paymentsFilterSchema)) filters: ReturnType<typeof paymentsFilterSchema.parse>,
  ) {
    return this.paymentsService.findAll(filters.customerId);
  }

  @Get(":id")
  @RequirePermissions("CUSTOMER_VIEW")
  findOne(@Param("id") id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post()
  @RequirePermissions("PAYMENT_CREATE")
  create(
    @Body(new ZodValidationPipe(createPaymentSchema)) body: ReturnType<typeof createPaymentSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.paymentsService.create(body, user.id);
  }

  @Post(":id/allocate")
  @RequirePermissions("PAYMENT_CREATE")
  allocate(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(allocatePaymentSchema)) body: ReturnType<typeof allocatePaymentSchema.parse>,
  ) {
    return this.paymentsService.allocate(id, body);
  }

  @Post(":id/void")
  @RequirePermissions("PAYMENT_VOID")
  void(@Param("id") id: string, @CurrentUser() user: SessionResult["user"]) {
    return this.paymentsService.void(id, user.id);
  }
}
