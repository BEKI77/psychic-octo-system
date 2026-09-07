import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard, type SessionResult } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import {
  addReturnItemSchema,
  createReturnSchema,
  inspectReturnSchema,
  returnsFilterSchema,
} from "./returns.schema.js";
import { ReturnsService } from "./returns.service.js";

@Controller("v1/returns")
@UseGuards(SessionGuard, PermissionsGuard)
@RequirePermissions("INVENTORY_RETURN")
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(returnsFilterSchema)) filters: ReturnType<typeof returnsFilterSchema.parse>,
  ) {
    return this.returnsService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.returnsService.findOne(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createReturnSchema)) body: ReturnType<typeof createReturnSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.returnsService.create(body, user.id);
  }

  @Post(":id/items")
  addItem(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addReturnItemSchema)) body: ReturnType<typeof addReturnItemSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.returnsService.addItem(id, body, user.id);
  }

  @Delete(":id/items/:itemId")
  removeItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.returnsService.removeItem(id, itemId, user.id);
  }

  @Post(":id/inspect")
  inspect(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(inspectReturnSchema)) body: ReturnType<typeof inspectReturnSchema.parse>,
    @CurrentUser() user: SessionResult["user"],
  ) {
    return this.returnsService.inspect(id, body, user.id);
  }

  @Post(":id/complete")
  complete(@Param("id") id: string, @CurrentUser() user: SessionResult["user"]) {
    return this.returnsService.complete(id, user.id);
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string, @CurrentUser() user: SessionResult["user"]) {
    return this.returnsService.cancel(id, user.id);
  }
}
