"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
async function GET() {
    try {
        const categories = await db_1.db.cropCategory.findMany({
            orderBy: { name: "asc" },
        });
        return server_1.NextResponse.json(categories);
    }
    catch (error) {
        console.error("GET Categories Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
