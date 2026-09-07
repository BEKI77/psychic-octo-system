import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { dateRangeSchema } from "./reports.schema.js";
import { ReportsService } from "./reports.service.js";

@Controller("v1/reports")
@UseGuards(SessionGuard, PermissionsGuard)
@RequirePermissions("REPORT_VIEW")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("credit-aging")
  creditAging() {
    return this.reportsService.creditAging();
  }

  @Get("customer-balances")
  customerBalances() {
    return this.reportsService.customerBalances();
  }

  @Get("sales")
  sales(@Query(new ZodValidationPipe(dateRangeSchema)) filters: ReturnType<typeof dateRangeSchema.parse>) {
    return this.reportsService.salesReport(filters);
  }

  @Get("payments")
  payments(@Query(new ZodValidationPipe(dateRangeSchema)) filters: ReturnType<typeof dateRangeSchema.parse>) {
    return this.reportsService.paymentsReport(filters);
  }

  @Get("inventory")
  inventory() {
    return this.reportsService.inventoryReport();
  }

  @Get("cylinder-accountability")
  cylinderAccountability() {
    return this.reportsService.cylinderAccountability();
  }
}
