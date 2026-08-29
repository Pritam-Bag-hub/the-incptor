"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const server_1 = require("next/server");
function middleware(request) {
    const token = request.cookies.get("session_token")?.value;
    const { pathname } = request.nextUrl;
    const isDashboardPath = pathname.startsWith("/dashboard");
    const isAdminPath = pathname.startsWith("/admin");
    if ((isDashboardPath || isAdminPath) && !token) {
        // Redirect unauthenticated user to onboarding roles selection page
        return server_1.NextResponse.redirect(new URL("/roles", request.url));
    }
    return server_1.NextResponse.next();
}
exports.config = {
    matcher: ["/dashboard/:path*", "/admin/:path*"],
};
