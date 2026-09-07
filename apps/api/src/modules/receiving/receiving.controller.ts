import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard, type SessionResult } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import {
  addReceiptItemSchema,
  createReceiptSchema,
  updateReceiptSchema,
} from "./receiving.schema.js";
import { ReceivingService } from "./receiving.service.js";

@Controller("v1/receipts")
@UseGuards(SessionGuard, PermissionsGuard)
@RequirePermissions("INVENTORY_RECEIVE")
export class ReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Get()
  findAll() {
    return this.receivingService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.receivingService.findOne(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createReceiptSchema)) body: ReturnType<typeof createReceiptSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.receivingService.create(body, user.id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateReceiptSchema)) body: ReturnType<typeof updateReceiptSchema.parse>,
  ) {
    return this.receivingService.update(id, body);
  }

  @Post(":id/items")
  addItem(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addReceiptItemSchema)) body: ReturnType<typeof addReceiptItemSchema.parse>,
  ) {
    return this.receivingService.addItem(id, body);
  }

  @Delete(":id/items/:itemId")
  removeItem(@Param("id") id: string, @Param("itemId") itemId: string) {
    return this.receivingService.removeItem(id, itemId);
  }

  @Post(":id/confirm")
  confirm(@Param("id") id: string, @CurrentUser() user: SessionResult["user"]) {
    return this.receivingService.confirm(id, user.id);
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.receivingService.cancel(id);
  }
}
