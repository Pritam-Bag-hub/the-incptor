"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const headers_1 = require("next/headers");
const db_1 = require("@/lib/db");
async function GET() {
    try {
        const cookieStore = await (0, headers_1.cookies)();
        const token = cookieStore.get("session_token")?.value;
        if (!token) {
            return server_1.NextResponse.json({ authenticated: false }, { status: 401 });
        }
        const session = await db_1.db.session.findUnique({
            where: { token },
            include: {
                user: true,
            },
        });
        if (!session || session.expiresAt < new Date()) {
            if (session) {
                await db_1.db.session.delete({ where: { id: session.id } }).catch(() => { });
            }
            cookieStore.delete("session_token");
            return server_1.NextResponse.json({ authenticated: false }, { status: 401 });
        }
        return server_1.NextResponse.json({
            authenticated: true,
            user: {
                id: session.user.id,
                name: session.user.name,
                phone: session.user.phone,
                role: session.user.role,
            },
        });
    }
    catch (error) {
        console.error("Get Me API Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
