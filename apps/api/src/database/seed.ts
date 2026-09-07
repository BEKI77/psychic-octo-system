/**
 * Seeds RBAC roles/permissions and a bootstrap admin user.
 * Usage: pnpm db:seed
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "../auth/auth.js";
import { PERMISSIONS, ROLE_DEFINITIONS } from "../auth/permissions.js";
import { db, pool } from "./db.js";
import { permissions, rolePermissions, roles, userRoles, users } from "./schema/index.js";

async function seedPermissions() {
  for (const code of PERMISSIONS) {
    await db
      .insert(permissions)
      .values({ code, description: code.replace(/_/g, " ").toLowerCase() })
      .onConflictDoNothing({ target: permissions.code });
  }
  console.log(`Seeded ${PERMISSIONS.length} permissions.`);
}

async function seedRoles() {
  for (const [name, def] of Object.entries(ROLE_DEFINITIONS)) {
    await db
      .insert(roles)
      .values({ name, description: def.description })
      .onConflictDoNothing({ target: roles.name });

    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    if (!role) continue;

    for (const code of def.permissions) {
      const [permission] = await db.select().from(permissions).where(eq(permissions.code, code));
      if (!permission) continue;
      await db
        .insert(rolePermissions)
        .values({ roleId: role.id, permissionId: permission.id })
        .onConflictDoNothing();
    }
  }
  console.log(`Seeded ${Object.keys(ROLE_DEFINITIONS).length} roles.`);
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@cylinder.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  let adminUserId: string;

  if (existing) {
    adminUserId = existing.id;
    console.log(`Admin user already exists: ${email}`);
  } else {
    const result = await auth.api.signUpEmail({
      body: {
        name: "System Administrator",
        email,
        password,
        username: "admin",
        firstName: "System",
        lastName: "Administrator",
      },
    });
    adminUserId = result.user.id;
    console.log(`Created admin user: ${email} / ${password} (change this after first login)`);
  }

  const [adminRole] = await db.select().from(roles).where(eq(roles.name, "ADMIN"));
  if (adminRole) {
    await db
      .insert(userRoles)
      .values({ userId: adminUserId, roleId: adminRole.id })
      .onConflictDoNothing();
  }
}

async function main() {
  await seedPermissions();
  await seedRoles();
  await seedAdmin();
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
