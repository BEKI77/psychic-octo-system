import { Module } from "@nestjs/common";
import { CylindersController } from "./cylinders.controller.js";
import { CylindersService } from "./cylinders.service.js";

@Module({
  controllers: [CylindersController],
  providers: [CylindersService],
  exports: [CylindersService],
})
export class CylindersModule {}
