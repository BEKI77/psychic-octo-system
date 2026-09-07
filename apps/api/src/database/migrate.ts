/**
 * Runs pending Drizzle migrations against DATABASE_URL.
 * Usage: pnpm db:migrate  (after pnpm db:generate)
 */
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db.js";

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
