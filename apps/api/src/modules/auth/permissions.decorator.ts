import { SetMetadata } from "@nestjs/common";
import type { PermissionCode } from "../../auth/permissions.js";

export const PERMISSIONS_KEY = "requiredPermissions";

/** Require the current user to hold ALL listed permission codes (checked by PermissionsGuard). */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
