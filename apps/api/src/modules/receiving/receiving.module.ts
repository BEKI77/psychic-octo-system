import { Module } from "@nestjs/common";
import { CylindersModule } from "../cylinders/cylinders.module.js";
import { ReceivingController } from "./receiving.controller.js";
import { ReceivingService } from "./receiving.service.js";

@Module({
  imports: [CylindersModule],
  controllers: [ReceivingController],
  providers: [ReceivingService],
})
export class ReceivingModule {}
