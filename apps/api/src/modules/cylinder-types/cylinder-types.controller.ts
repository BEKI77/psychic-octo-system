import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { createCylinderTypeSchema, updateCylinderTypeSchema } from "./cylinder-types.schema.js";
import { CylinderTypesService } from "./cylinder-types.service.js";

@Controller("v1/cylinder-types")
@UseGuards(SessionGuard, PermissionsGuard)
export class CylinderTypesController {
  constructor(private readonly cylinderTypesService: CylinderTypesService) {}

  @Get()
  @RequirePermissions("CYLINDER_VIEW")
  findAll() {
    return this.cylinderTypesService.findAll();
  }

  @Get(":id")
  @RequirePermissions("CYLINDER_VIEW")
  findOne(@Param("id") id: string) {
    return this.cylinderTypesService.findOne(id);
  }

  @Post()
  @RequirePermissions("CYLINDER_TYPE_MANAGE")
  create(
    @Body(new ZodValidationPipe(createCylinderTypeSchema))
    body: ReturnType<typeof createCylinderTypeSchema.parse>,
  ) {
    return this.cylinderTypesService.create(body);
  }

  @Patch(":id")
  @RequirePermissions("CYLINDER_TYPE_MANAGE")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCylinderTypeSchema))
    body: ReturnType<typeof updateCylinderTypeSchema.parse>,
  ) {
    return this.cylinderTypesService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions("CYLINDER_TYPE_MANAGE")
  remove(@Param("id") id: string) {
    return this.cylinderTypesService.remove(id);
  }
}
