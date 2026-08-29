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
        const { id: contractId } = await params;
        const contract = await db_1.db.contract.findUnique({
            where: { id: contractId },
        });
        if (!contract) {
            return server_1.NextResponse.json({ error: "Contract proposal not found." }, { status: 404 });
        }
        if (contract.buyerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this contract proposal." }, { status: 403 });
        }
        if (contract.status !== "PENDING_APPROVAL") {
            return server_1.NextResponse.json({ error: "Only pending contract proposals can be cancelled." }, { status: 400 });
        }
        const updated = await db_1.db.contract.update({
            where: { id: contractId },
            data: {
                status: "CANCELLED",
            },
        });
        return server_1.NextResponse.json({ success: true, contract: updated });
    }
    catch (error) {
        console.error("PATCH Cancel Contract Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
