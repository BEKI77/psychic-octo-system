import { Module } from "@nestjs/common";
import { LocationsController } from "./locations.controller.js";
import { LocationsService } from "./locations.service.js";
import { WarehousesController } from "./warehouses.controller.js";
import { WarehousesService } from "./warehouses.service.js";

@Module({
  controllers: [WarehousesController, LocationsController],
  providers: [WarehousesService, LocationsService],
})
export class WarehousesModule {}
