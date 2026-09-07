import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { FRONTEND_TEST_MODE } from "@/lib/frontend-test-mode";

// Route protection is UX-only: it just checks whether a session cookie is
// present, it never validates it. The NestJS API is the authority (design
// §2.5 "Backend is authoritative") — SessionGuard/PermissionsGuard reject
// anything this proxy lets through by mistake.
const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = FRONTEND_TEST_MODE || Boolean(getSessionCookie(request));
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path);

  if (!hasSession && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // sw.js/manifest.webmanifest/icon.svg must stay reachable without a
  // session — a redirect response breaks service worker registration
  // outright (redirected worker-script fetches are rejected outright by
  // browsers), and the manifest/icon are fetched by the browser chrome
  // itself, unauthenticated, for install prompts (§37 PWA Strategy).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icon.svg).*)"],
};
