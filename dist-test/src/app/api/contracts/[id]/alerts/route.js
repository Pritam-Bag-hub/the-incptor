"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const contractMonitoring_1 = require("@/lib/contractMonitoring");
async function GET(request, { params }) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: contractId } = await params;
        const contract = await db_1.db.contract.findUnique({
            where: { id: contractId },
        });
        if (!contract) {
            return server_1.NextResponse.json({ error: "Contract not found." }, { status: 404 });
        }
        // Access check: User must be buyer or landowner
        if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: Unauthorized access." }, { status: 403 });
        }
        // Synchronize monitoring states and retrieve alerts
        const state = await (0, contractMonitoring_1.calculateContractMonitoringState)(contractId);
        if (!state) {
            return server_1.NextResponse.json({ error: "Failed to calculate monitoring state." }, { status: 500 });
        }
        return server_1.NextResponse.json(state.alerts);
    }
    catch (error) {
        console.error("GET Alerts Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
