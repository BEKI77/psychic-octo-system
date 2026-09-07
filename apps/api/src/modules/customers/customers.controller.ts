import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { createCustomerSchema, updateCustomerSchema } from "./customers.schema.js";
import { CustomersService } from "./customers.service.js";

@Controller("v1/customers")
@UseGuards(SessionGuard, PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions("CUSTOMER_VIEW")
  findAll() {
    return this.customersService.findAll();
  }

  @Get(":id")
  @RequirePermissions("CUSTOMER_VIEW")
  findOne(@Param("id") id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @RequirePermissions("CUSTOMER_CREATE")
  create(
    @Body(new ZodValidationPipe(createCustomerSchema)) body: ReturnType<typeof createCustomerSchema.parse>,
  ) {
    return this.customersService.create(body);
  }

  @Patch(":id")
  @RequirePermissions("CUSTOMER_UPDATE")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema)) body: ReturnType<typeof updateCustomerSchema.parse>,
  ) {
    return this.customersService.update(id, body);
  }

  @Get(":id/credit")
  @RequirePermissions("CUSTOMER_VIEW")
  getCredit(@Param("id") id: string) {
    return this.customersService.getCredit(id);
  }

  @Get(":id/cylinders")
  @RequirePermissions("CUSTOMER_VIEW")
  getCylinders(@Param("id") id: string) {
    return this.customersService.getCylinders(id);
  }

  @Get(":id/transactions")
  @RequirePermissions("CUSTOMER_VIEW")
  getTransactions(@Param("id") id: string) {
    return this.customersService.getTransactions(id);
  }

  @Get(":id/ledger")
  @RequirePermissions("CUSTOMER_VIEW")
  getLedger(@Param("id") id: string) {
    return this.customersService.getLedger(id);
  }
}
