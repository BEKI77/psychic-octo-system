/**
 * Shared Drizzle client. Plain module (not a NestJS provider) so it can be
 * imported both by the Nest app (via DatabaseModule) and by standalone
 * scripts (migrate.ts, seed.ts) and the Better Auth instance (src/auth/auth.ts)
 * that must exist outside the Nest DI container.
 */
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (check apps/api/.env)");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema, casing: "snake_case" });

export type Database = typeof db;
