"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
async function GET(request, { params }) {
    try {
        const { id } = await params;
        const crop = await db_1.db.crop.findUnique({
            where: { id },
            include: {
                category: true,
            },
        });
        if (!crop) {
            return server_1.NextResponse.json({ error: "Crop not found" }, { status: 404 });
        }
        return server_1.NextResponse.json(crop);
    }
    catch (error) {
        console.error("GET Crop Detail Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
