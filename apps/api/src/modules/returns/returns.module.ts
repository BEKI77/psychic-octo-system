import { Module } from "@nestjs/common";
import { ApprovalsModule } from "../approvals/approvals.module.js";
import { ReturnsController } from "./returns.controller.js";
import { ReturnsService } from "./returns.service.js";

@Module({
  imports: [ApprovalsModule],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
