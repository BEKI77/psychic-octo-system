"use client";

import { createAuthClient } from "better-auth/react";

// No baseURL: requests go to the relative /api/auth path, which Next.js
// rewrites (see next.config.ts) to the NestJS API on the same origin as far
// as the browser is concerned, so the session cookie is same-site.
export const authClient = createAuthClient({
  basePath: "/api/auth",
});

export const { signIn, signOut, useSession } = authClient;
