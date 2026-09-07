import { Module } from "@nestjs/common";
import { RolesController } from "./roles.controller.js";
import { RolesAdminService } from "./roles.service.js";

@Module({
  controllers: [RolesController],
  providers: [RolesAdminService],
})
export class RolesModule {}
