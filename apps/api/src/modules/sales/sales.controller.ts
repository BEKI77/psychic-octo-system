import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard, type SessionResult } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import {
  addSaleItemSchema,
  confirmSaleSchema,
  createSaleSchema,
  salesFilterSchema,
} from "./sales.schema.js";
import { SalesService } from "./sales.service.js";

@Controller("v1/sales")
@UseGuards(SessionGuard, PermissionsGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequirePermissions("CUSTOMER_VIEW")
  findAll(@Query(new ZodValidationPipe(salesFilterSchema)) filters: ReturnType<typeof salesFilterSchema.parse>) {
    return this.salesService.findAll(filters);
  }

  @Get(":id")
  @RequirePermissions("CUSTOMER_VIEW")
  findOne(@Param("id") id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  @RequirePermissions("INVENTORY_ISSUE")
  create(
    @Body(new ZodValidationPipe(createSaleSchema)) body: ReturnType<typeof createSaleSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.salesService.create(body, user.id);
  }

  @Post(":id/items")
  @RequirePermissions("INVENTORY_ISSUE")
  addItem(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addSaleItemSchema)) body: ReturnType<typeof addSaleItemSchema.parse>,
  ) {
    return this.salesService.addItem(id, body);
  }

  @Delete(":id/items/:itemId")
  @RequirePermissions("INVENTORY_ISSUE")
  removeItem(@Param("id") id: string, @Param("itemId") itemId: string) {
    return this.salesService.removeItem(id, itemId);
  }

  @Post(":id/confirm")
  @RequirePermissions("INVENTORY_ISSUE")
  confirm(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(confirmSaleSchema)) body: ReturnType<typeof confirmSaleSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.salesService.confirm(id, body, user.id);
  }

  @Post(":id/cancel")
  @RequirePermissions("INVENTORY_ISSUE")
  cancel(@Param("id") id: string) {
    return this.salesService.cancel(id);
  }
}
