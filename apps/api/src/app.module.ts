import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller.js";
import { AuditLogInterceptor } from "./common/audit-log.interceptor.js";
import { ApprovalsModule } from "./modules/approvals/approvals.module.js";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { CustomersModule } from "./modules/customers/customers.module.js";
import { CylinderTypesModule } from "./modules/cylinder-types/cylinder-types.module.js";
import { CylindersModule } from "./modules/cylinders/cylinders.module.js";
import { InventoryModule } from "./modules/inventory/inventory.module.js";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module.js";
import { NotificationsModule } from "./modules/notifications/notifications.module.js";
import { PaymentsModule } from "./modules/payments/payments.module.js";
import { ReceivingModule } from "./modules/receiving/receiving.module.js";
import { ReportsModule } from "./modules/reports/reports.module.js";
import { ReturnsModule } from "./modules/returns/returns.module.js";
import { RolesModule } from "./modules/roles/roles.module.js";
import { SalesModule } from "./modules/sales/sales.module.js";
import { SuppliersModule } from "./modules/suppliers/suppliers.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { WarehousesModule } from "./modules/warehouses/warehouses.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    RolesModule,
    WarehousesModule,
    CylinderTypesModule,
    CylindersModule,
    SuppliersModule,
    ReceivingModule,
    InventoryModule,
    CustomersModule,
    SalesModule,
    PaymentsModule,
    ReturnsModule,
    MaintenanceModule,
    ReportsModule,
    AuditLogsModule,
    NotificationsModule,
    ApprovalsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor }],
})
export class AppModule {}
