import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { permissions, rolePermissions, userRoles } from "../../database/schema/index.js";

@Injectable()
export class RolesService {
  /** RBAC lookup (§6.3): user -> user_roles -> role_permissions -> permissions. */
  async getPermissionCodesForUser(userId: string): Promise<Set<string>> {
    const rows = await db
      .select({ code: permissions.code })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(userRoles.userId, userId));

    return new Set(rows.map((row) => row.code));
  }
}
