"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATCH = PATCH;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
async function PATCH(request, { params }) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "BUYER") {
            return server_1.NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
        }
        const { id } = await params;
        const demand = await db_1.db.buyerDemand.findUnique({
            where: { id },
        });
        if (!demand) {
            return server_1.NextResponse.json({ error: "Demand not found" }, { status: 404 });
        }
        if (demand.buyerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
        }
        const body = await request.json();
        const { status } = body;
        if (status !== "DRAFT" &&
            status !== "ACTIVE" &&
            status !== "PAUSED" &&
            status !== "CLOSED") {
            return server_1.NextResponse.json({ error: "Invalid status value." }, { status: 400 });
        }
        const updatedDemand = await db_1.db.buyerDemand.update({
            where: { id },
            data: {
                status: status,
            },
        });
        return server_1.NextResponse.json({ success: true, status: updatedDemand.status });
    }
    catch (error) {
        console.error("PATCH Demand Status Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
