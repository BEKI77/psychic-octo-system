import { Body, Controller, Delete, Param, Patch, UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "../auth/permissions.guard.js";
import { RequirePermissions } from "../auth/permissions.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { LocationsService } from "./locations.service.js";
import { updateLocationSchema } from "./warehouses.schema.js";

@Controller("v1/locations")
@UseGuards(SessionGuard, PermissionsGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Patch(":id")
  @RequirePermissions("WAREHOUSE_MANAGE")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateLocationSchema)) body: ReturnType<typeof updateLocationSchema.parse>,
  ) {
    return this.locationsService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions("WAREHOUSE_MANAGE")
  remove(@Param("id") id: string) {
    return this.locationsService.remove(id);
  }
}
