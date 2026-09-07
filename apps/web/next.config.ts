import type { NextConfig } from "next";

// The NestJS API origin. In dev the browser only ever talks to the Next.js
// origin (localhost:3000); Next rewrites /api/* to the API server so the
// Better Auth session cookie is set for one origin and no CORS is needed.
// In production the reverse proxy (§4 of the design) does the same job by
// routing /api/* to the API service under one public domain.
const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
