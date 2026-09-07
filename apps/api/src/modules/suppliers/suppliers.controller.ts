import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { createSupplierSchema, updateSupplierSchema } from "./suppliers.schema.js";
import { SuppliersService } from "./suppliers.service.js";

@Controller("v1/suppliers")
@UseGuards(SessionGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions("SUPPLIER_VIEW")
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(":id")
  @RequirePermissions("SUPPLIER_VIEW")
  findOne(@Param("id") id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @RequirePermissions("SUPPLIER_MANAGE")
  create(
    @Body(new ZodValidationPipe(createSupplierSchema)) body: ReturnType<typeof createSupplierSchema.parse>,
  ) {
    return this.suppliersService.create(body);
  }

  @Patch(":id")
  @RequirePermissions("SUPPLIER_MANAGE")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSupplierSchema)) body: ReturnType<typeof updateSupplierSchema.parse>,
  ) {
    return this.suppliersService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions("SUPPLIER_MANAGE")
  remove(@Param("id") id: string) {
    return this.suppliersService.remove(id);
  }
}
