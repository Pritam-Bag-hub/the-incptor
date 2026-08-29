"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const headers_1 = require("next/headers");
const db_1 = require("@/lib/db");
const crypto_1 = __importDefault(require("crypto"));
async function POST(request) {
    try {
        const { phone, otp } = await request.json();
        if (!phone) {
            return server_1.NextResponse.json({ error: "Phone number is required." }, { status: 400 });
        }
        if (otp !== "0000") {
            return server_1.NextResponse.json({ error: "Demo: Please enter '0000' as the OTP." }, { status: 400 });
        }
        const targetPhone = phone.trim();
        // Find the user. We allow input like "9999999991", "+919999999991", or "9999999991"
        const user = await db_1.db.user.findFirst({
            where: {
                OR: [
                    { phone: targetPhone },
                    { phone: `+91${targetPhone}` },
                    { phone: `+${targetPhone}` },
                    { phone: targetPhone.startsWith("+91") ? targetPhone : `+91${targetPhone.replace(/^91/, "")}` }
                ],
            },
        });
        if (!user) {
            return server_1.NextResponse.json({ error: "Phone number not registered in the system." }, { status: 401 });
        }
        // Generate secure random session token
        const token = crypto_1.default.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration
        // Store session in database
        await db_1.db.session.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });
        // Set cookie
        const cookieStore = await (0, headers_1.cookies)();
        cookieStore.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: expiresAt,
            path: "/",
        });
        return server_1.NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Login API Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
