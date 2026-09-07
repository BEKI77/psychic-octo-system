import { Module } from "@nestjs/common";
import { CylinderTypesController } from "./cylinder-types.controller.js";
import { CylinderTypesService } from "./cylinder-types.service.js";

@Module({
  controllers: [CylinderTypesController],
  providers: [CylinderTypesService],
})
export class CylinderTypesModule {}
