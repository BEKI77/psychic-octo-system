import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { permissions, rolePermissions, roles } from "../../database/schema/index.js";
import type { CreateRoleInput, UpdateRoleInput } from "./roles.schema.js";

@Injectable()
export class RolesAdminService {
  listPermissions() {
    return db.select().from(permissions).orderBy(permissions.code);
  }

  findAllRoles() {
    return db.query.roles.findMany({
      with: { rolePermissions: { with: { permission: true } } },
      orderBy: (table, { asc }) => asc(table.name),
    });
  }

  async findOneRole(id: string) {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, id),
      with: { rolePermissions: { with: { permission: true } } },
    });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  async create(input: CreateRoleInput) {
    const [existing] = await db.select().from(roles).where(eq(roles.name, input.name));
    if (existing) throw new ConflictException("A role with this name already exists");

    const [role] = await db
      .insert(roles)
      .values({ name: input.name, description: input.description })
      .returning();

    if (input.permissionIds.length > 0) {
      await db
        .insert(rolePermissions)
        .values(input.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })));
    }

    return this.findOneRole(role.id);
  }

  async update(id: string, input: UpdateRoleInput) {
    await this.findOneRole(id);

    if (input.description !== undefined) {
      await db.update(roles).set({ description: input.description, updatedAt: new Date() }).where(eq(roles.id, id));
    }

    if (input.permissionIds) {
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
      if (input.permissionIds.length > 0) {
        await db
          .insert(rolePermissions)
          .values(input.permissionIds.map((permissionId) => ({ roleId: id, permissionId })));
      }
    }

    return this.findOneRole(id);
  }

  async remove(id: string) {
    await this.findOneRole(id);
    await db.delete(roles).where(eq(roles.id, id));
  }
}
