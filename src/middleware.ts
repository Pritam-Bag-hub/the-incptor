import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  const { pathname } = request.nextUrl;

  const isDashboardPath = pathname.startsWith("/dashboard");
  const isAdminPath = pathname.startsWith("/admin");

  if ((isDashboardPath || isAdminPath) && !token) {
    // Redirect unauthenticated user to onboarding roles selection page
    return NextResponse.redirect(new URL("/roles", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
