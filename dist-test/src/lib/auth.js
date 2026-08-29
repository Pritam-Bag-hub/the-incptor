"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionUser = getSessionUser;
const headers_1 = require("next/headers");
const db_1 = require("./db");
async function getSessionUser() {
    const cookieStore = await (0, headers_1.cookies)();
    const token = cookieStore.get("session_token")?.value;
    if (!token)
        return null;
    const session = await db_1.db.session.findUnique({
        where: { token },
        include: {
            user: true,
        },
    });
    if (!session || session.expiresAt < new Date()) {
        return null;
    }
    return session.user;
}
