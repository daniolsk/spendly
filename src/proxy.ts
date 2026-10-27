import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { currentMonthKey, zonedToday } from "@/lib/month";

// Optimistic redirect only. Real authorization happens in the data access layer
// (src/server/dal.ts) for every page and server action.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== "/login" && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/m") {
    return NextResponse.redirect(new URL(`/m/${currentMonthKey(zonedToday())}`, request.url));
  }
  if (pathname === "/y") {
    return NextResponse.redirect(new URL(`/y/${zonedToday().getFullYear()}`, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\\.(?:png|svg|jpg|ico)$).*)",
  ],
};
