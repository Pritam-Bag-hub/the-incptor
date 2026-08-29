"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryParam = searchParams.get("category");
        const whereClause = {};
        if (categoryParam) {
            whereClause.OR = [
                { categoryId: categoryParam },
                { category: { name: categoryParam } },
            ];
        }
        const crops = await db_1.db.crop.findMany({
            where: whereClause,
            include: {
                category: true,
            },
            orderBy: { name: "asc" },
        });
        return server_1.NextResponse.json(crops);
    }
    catch (error) {
        console.error("GET Crops Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
