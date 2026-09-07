import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { createUserSchema, updateUserSchema } from "./users.schema.js";
import { UsersService } from "./users.service.js";

@Controller("v1/users")
@UseGuards(SessionGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions("USER_VIEW")
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @RequirePermissions("USER_VIEW")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions("USER_MANAGE")
  create(@Body(new ZodValidationPipe(createUserSchema)) body: ReturnType<typeof createUserSchema.parse>) {
    return this.usersService.create(body);
  }

  @Patch(":id")
  @RequirePermissions("USER_MANAGE")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: ReturnType<typeof updateUserSchema.parse>,
  ) {
    return this.usersService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions("USER_MANAGE")
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
