import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import {
  createCylinderSchema,
  cylinderFiltersSchema,
  updateCylinderSchema,
} from "./cylinders.schema.js";
import { CylindersService } from "./cylinders.service.js";

@Controller("v1/cylinders")
@UseGuards(SessionGuard, PermissionsGuard)
export class CylindersController {
  constructor(private readonly cylindersService: CylindersService) {}

  @Get()
  @RequirePermissions("CYLINDER_VIEW")
  findAll(@Query(new ZodValidationPipe(cylinderFiltersSchema)) filters: ReturnType<typeof cylinderFiltersSchema.parse>) {
    return this.cylindersService.findAll(filters);
  }

  // Must come before ":id" — otherwise "lookup"/"by-qr" would be matched as an id.
  @Get("lookup/:code")
  @RequirePermissions("CYLINDER_VIEW")
  lookup(@Param("code") code: string) {
    return this.cylindersService.lookup(code);
  }

  @Get("by-qr/:code")
  @RequirePermissions("CYLINDER_VIEW")
  findByQr(@Param("code") code: string) {
    return this.cylindersService.findByQr(code);
  }

  @Get("by-barcode/:code")
  @RequirePermissions("CYLINDER_VIEW")
  findByBarcode(@Param("code") code: string) {
    return this.cylindersService.findByBarcode(code);
  }

  @Get(":id")
  @RequirePermissions("CYLINDER_VIEW")
  findOne(@Param("id") id: string) {
    return this.cylindersService.findOne(id);
  }

  @Post()
  @RequirePermissions("CYLINDER_CREATE")
  create(
    @Body(new ZodValidationPipe(createCylinderSchema)) body: ReturnType<typeof createCylinderSchema.parse>,
  ) {
    return this.cylindersService.create(body);
  }

  @Patch(":id")
  @RequirePermissions("CYLINDER_UPDATE")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCylinderSchema)) body: ReturnType<typeof updateCylinderSchema.parse>,
  ) {
    return this.cylindersService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions("CYLINDER_UPDATE")
  remove(@Param("id") id: string) {
    return this.cylindersService.remove(id);
  }
}
