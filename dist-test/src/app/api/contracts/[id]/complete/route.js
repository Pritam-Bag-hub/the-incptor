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
        const { id: contractId } = await params;
        const result = await db_1.db.$transaction(async (tx) => {
            const contract = await tx.contract.findUnique({
                where: { id: contractId },
                include: { land: true },
            });
            if (!contract) {
                throw new Error("Contract not found.");
            }
            // Check authorization: must be buyer or landowner
            if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
                throw new Error("Forbidden: You are not authorized to access this contract.");
            }
            if (contract.status === "COMPLETED") {
                throw new Error("Contract is already completed.");
            }
            if (contract.status !== "ACTIVE") {
                throw new Error("Only active contracts can be completed.");
            }
            // Update contract to COMPLETED
            const updatedContract = await tx.contract.update({
                where: { id: contractId },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                },
            });
            // Release land status to AVAILABLE
            await tx.land.update({
                where: { id: contract.landId },
                data: {
                    status: "AVAILABLE",
                },
            });
            return updatedContract;
        });
        return server_1.NextResponse.json({ success: true, contract: result });
    }
    catch (error) {
        console.error("PATCH Complete Contract Error:", error);
        return server_1.NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.message?.includes("Forbidden") ? 403 : 400 });
    }
}
