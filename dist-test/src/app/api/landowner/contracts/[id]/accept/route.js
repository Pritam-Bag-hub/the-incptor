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
        if (user.role !== "LANDOWNER") {
            return server_1.NextResponse.json({ error: "Forbidden: Landowner role required" }, { status: 403 });
        }
        const { id: contractId } = await params;
        // Run transaction
        const result = await db_1.db.$transaction(async (tx) => {
            const contract = await tx.contract.findUnique({
                where: { id: contractId },
            });
            if (!contract) {
                throw new Error("Contract proposal not found.");
            }
            if (contract.landownerId !== user.id) {
                throw new Error("Forbidden: You do not own the land associated with this contract.");
            }
            if (contract.status !== "PENDING_APPROVAL") {
                throw new Error("Only pending contract proposals can be accepted.");
            }
            // Try lock land parcel (conditional update)
            const landUpdate = await tx.land.updateMany({
                where: {
                    id: contract.landId,
                    status: "AVAILABLE",
                },
                data: {
                    status: "UNDER_CONTRACT",
                },
            });
            if (landUpdate.count !== 1) {
                throw new Error("Land is no longer available or has already been reserved.");
            }
            // Update current contract
            const acceptedContract = await tx.contract.update({
                where: { id: contractId },
                data: {
                    status: "ACCEPTED",
                    decisionDate: new Date(),
                },
            });
            // Reject all other pending contracts for the same land parcel
            await tx.contract.updateMany({
                where: {
                    landId: contract.landId,
                    status: "PENDING_APPROVAL",
                    id: { not: contractId },
                },
                data: {
                    status: "REJECTED",
                    decisionDate: new Date(),
                    notes: "This land was accepted under another contract proposal.",
                },
            });
            return acceptedContract;
        });
        return server_1.NextResponse.json({ success: true, contract: result });
    }
    catch (error) {
        console.error("PATCH Accept Contract Error:", error);
        return server_1.NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
    }
}
