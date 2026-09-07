// Local frontend previews intentionally bypass backend authentication. This is disabled in production builds.
export const FRONTEND_TEST_MODE = process.env.NODE_ENV !== "production";
