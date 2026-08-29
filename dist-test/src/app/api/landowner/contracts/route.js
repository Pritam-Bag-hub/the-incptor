"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
async function GET(request) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "LANDOWNER") {
            return server_1.NextResponse.json({ error: "Forbidden: Landowner role required" }, { status: 403 });
        }
        const contracts = await db_1.db.contract.findMany({
            where: {
                landownerId: user.id,
            },
            include: {
                land: true,
                crop: {
                    include: {
                        category: true,
                    },
                },
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                demand: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return server_1.NextResponse.json(contracts);
    }
    catch (error) {
        console.error("GET Landowner Contracts Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
