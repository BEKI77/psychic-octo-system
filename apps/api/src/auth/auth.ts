/**
 * Shared Better Auth instance. Owns identity + sessions per the design's
 * authentication boundary (§3): "Better Auth handles identity and sessions;
 * NestJS guards/services handle application authorization and business
 * permissions." RBAC (roles/permissions) lives outside Better Auth in
 * src/database/schema/rbac.schema.ts and src/modules/auth/permissions.guard.ts.
 *
 * This is a plain module (not a NestJS provider) so the seed script can
 * import it directly without booting the Nest DI container.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../database/db.js';
import * as schema from '../database/schema/index.js';

const webOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4000',
  trustedOrigins: webOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  advanced: {
    database: {
      generateId: () => randomUUID(),
    },
  },
  user: {
    additionalFields: {
      username: { type: 'string', required: true, input: true },
      firstName: { type: 'string', required: true, input: true },
      lastName: { type: 'string', required: true, input: true },
      phone: { type: 'string', required: false, input: true },
      isActive: {
        type: 'boolean',
        required: true,
        defaultValue: true,
        input: false,
      },
    },
  },
});

export type Auth = typeof auth;
