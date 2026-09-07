import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard, type SessionResult } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { adjustmentSchema, movementsQuerySchema, transferSchema } from "./inventory.schema.js";
import { InventoryService } from "./inventory.service.js";

@Controller("v1/inventory")
@UseGuards(SessionGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("summary")
  @RequirePermissions("CYLINDER_VIEW")
  summary() {
    return this.inventoryService.summary();
  }

  @Get("stock")
  @RequirePermissions("CYLINDER_VIEW")
  stock() {
    return this.inventoryService.stock();
  }

  @Get("movements")
  @RequirePermissions("CYLINDER_VIEW")
  movements(
    @Query(new ZodValidationPipe(movementsQuerySchema)) filters: ReturnType<typeof movementsQuerySchema.parse>,
  ) {
    return this.inventoryService.movements(filters);
  }

  @Post("transfer")
  @RequirePermissions("INVENTORY_TRANSFER")
  transfer(
    @Body(new ZodValidationPipe(transferSchema)) body: ReturnType<typeof transferSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.inventoryService.transfer(body, user.id);
  }

  @Post("adjustment")
  @RequirePermissions("INVENTORY_ADJUST")
  adjustment(
    @Body(new ZodValidationPipe(adjustmentSchema)) body: ReturnType<typeof adjustmentSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.inventoryService.adjustment(body, user.id);
  }
}
