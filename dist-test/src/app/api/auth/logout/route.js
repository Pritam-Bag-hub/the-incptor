"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const headers_1 = require("next/headers");
const db_1 = require("@/lib/db");
async function POST() {
    try {
        const cookieStore = await (0, headers_1.cookies)();
        const token = cookieStore.get("session_token")?.value;
        if (token) {
            // Delete session from database
            await db_1.db.session.deleteMany({
                where: { token },
            });
        }
        // Delete session cookie
        cookieStore.delete("session_token");
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        console.error("Logout API Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
