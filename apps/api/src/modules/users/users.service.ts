import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { auth } from "../../auth/auth.js";
import { db } from "../../database/db.js";
import { userRoles, userWarehouses, users } from "../../database/schema/index.js";
import type { CreateUserInput, UpdateUserInput } from "./users.schema.js";

@Injectable()
export class UsersService {
  async findAll() {
    return db.query.users.findMany({
      columns: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      with: { userRoles: { with: { role: true } }, userWarehouses: { with: { warehouse: true } } },
      orderBy: (table, { asc }) => asc(table.createdAt),
    });
  }

  async findOne(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      with: { userRoles: { with: { role: true } }, userWarehouses: { with: { warehouse: true } } },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(input: CreateUserInput) {
    const [existingUsername] = await db.select().from(users).where(eq(users.username, input.username));
    if (existingUsername) {
      throw new ConflictException("Username is already taken");
    }

    const result = await auth.api.signUpEmail({
      body: {
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        password: input.password,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
    });

    if (input.roleIds.length > 0) {
      await db
        .insert(userRoles)
        .values(input.roleIds.map((roleId) => ({ userId: result.user.id, roleId })))
        .onConflictDoNothing();
    }

    if (input.warehouseIds.length > 0) {
      await db
        .insert(userWarehouses)
        .values(input.warehouseIds.map((warehouseId) => ({ userId: result.user.id, warehouseId })))
        .onConflictDoNothing();
    }

    return this.findOne(result.user.id);
  }

  async update(id: string, input: UpdateUserInput) {
    await this.findOne(id);

    const { roleIds, warehouseIds, ...patch } = input;
    if (Object.keys(patch).length > 0) {
      await db
        .update(users)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(users.id, id));
    }

    if (roleIds) {
      await db.delete(userRoles).where(eq(userRoles.userId, id));
      if (roleIds.length > 0) {
        await db.insert(userRoles).values(roleIds.map((roleId) => ({ userId: id, roleId })));
      }
    }

    if (warehouseIds) {
      await db.delete(userWarehouses).where(eq(userWarehouses.userId, id));
      if (warehouseIds.length > 0) {
        await db.insert(userWarehouses).values(warehouseIds.map((warehouseId) => ({ userId: id, warehouseId })));
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await db.delete(users).where(eq(users.id, id));
  }
}
