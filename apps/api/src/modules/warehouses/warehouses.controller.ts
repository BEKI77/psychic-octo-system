import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { LocationsService } from "./locations.service.js";
import {
  createLocationSchema,
  createWarehouseSchema,
  updateWarehouseSchema,
} from "./warehouses.schema.js";
import { WarehousesService } from "./warehouses.service.js";

@Controller("v1/warehouses")
@UseGuards(SessionGuard, PermissionsGuard)
export class WarehousesController {
  constructor(
    private readonly warehousesService: WarehousesService,
    private readonly locationsService: LocationsService,
  ) {}

  @Get()
  @RequirePermissions("WAREHOUSE_VIEW")
  findAll() {
    return this.warehousesService.findAll();
  }

  @Get(":id")
  @RequirePermissions("WAREHOUSE_VIEW")
  findOne(@Param("id") id: string) {
    return this.warehousesService.findOne(id);
  }

  @Post()
  @RequirePermissions("WAREHOUSE_MANAGE")
  create(
    @Body(new ZodValidationPipe(createWarehouseSchema)) body: ReturnType<typeof createWarehouseSchema.parse>,
  ) {
    return this.warehousesService.create(body);
  }

  @Patch(":id")
  @RequirePermissions("WAREHOUSE_MANAGE")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateWarehouseSchema)) body: ReturnType<typeof updateWarehouseSchema.parse>,
  ) {
    return this.warehousesService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions("WAREHOUSE_MANAGE")
  remove(@Param("id") id: string) {
    return this.warehousesService.remove(id);
  }

  @Post(":id/locations")
  @RequirePermissions("WAREHOUSE_MANAGE")
  createLocation(
    @Param("id") warehouseId: string,
    @Body(new ZodValidationPipe(createLocationSchema)) body: ReturnType<typeof createLocationSchema.parse>,
  ) {
    return this.locationsService.create(warehouseId, body);
  }
}
