import { Module } from "@nestjs/common";
import { CustomersModule } from "../customers/customers.module.js";
import { SalesController } from "./sales.controller.js";
import { SalesService } from "./sales.service.js";

@Module({
  imports: [CustomersModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
