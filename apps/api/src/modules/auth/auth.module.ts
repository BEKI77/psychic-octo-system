import { Global, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { PermissionsGuard } from "./permissions.guard.js";
import { RolesService } from "./roles.service.js";
import { SessionGuard } from "./session.guard.js";
import { WarehouseAccessService } from "./warehouse-access.service.js";

@Global()
@Module({
  controllers: [AuthController],
  providers: [RolesService, SessionGuard, PermissionsGuard, WarehouseAccessService],
  exports: [RolesService, SessionGuard, PermissionsGuard, WarehouseAccessService],
})
export class AuthModule {}
