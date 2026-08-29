"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATCH = PATCH;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const contractHelpers_1 = require("@/lib/contractHelpers");
const taskHelpers_1 = require("@/lib/taskHelpers");
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
            include: {
                land: true,
                crop: true,
                demand: true,
            },
        });
        if (!contract) {
            return server_1.NextResponse.json({ error: "Contract proposal not found." }, { status: 404 });
        }
        if (contract.buyerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this contract." }, { status: 403 });
        }
        if (contract.status !== "ACCEPTED") {
            return server_1.NextResponse.json({ error: "Only accepted contract proposals can be activated." }, { status: 400 });
        }
        if (contract.land.status !== "UNDER_CONTRACT") {
            return server_1.NextResponse.json({ error: "The associated land parcel must be UNDER_CONTRACT to activate." }, { status: 400 });
        }
        const updated = await db_1.db.$transaction(async (tx) => {
            // 1. Update contract status
            const updatedContract = await tx.contract.update({
                where: { id: contractId },
                data: {
                    status: "ACTIVE",
                    activatedAt: new Date(),
                },
            });
            // 2. Initialize defaults for ContractFinancialAllocation (idempotent)
            const totalContractValue = contract.proposedPrice;
            const platformFee = totalContractValue * 0.10;
            const landownerAmount = totalContractValue * 0.50;
            const workforceBudget = totalContractValue * 0.25;
            const logisticsBudget = totalContractValue * 0.10;
            const reserveBudget = totalContractValue * 0.05;
            await tx.contractFinancialAllocation.upsert({
                where: { contractId },
                create: {
                    contractId,
                    totalContractValue,
                    landownerAmount,
                    workforceBudget,
                    logisticsBudget,
                    platformFee,
                    reserveBudget,
                    isConfigured: false,
                    currency: "INR",
                },
                update: {
                    totalContractValue,
                },
            });
            // 3. Initialize expected crop yield from metadata
            let estimatedQuantity = null;
            if (contract.crop.metadataJson) {
                try {
                    const meta = JSON.parse(contract.crop.metadataJson);
                    const yieldPerAcre = parseFloat(meta.expectedYieldPerAcre);
                    if (!isNaN(yieldPerAcre) && yieldPerAcre > 0) {
                        estimatedQuantity = yieldPerAcre * contract.landArea;
                    }
                }
                catch (e) {
                    console.error("Error parsing crop metadata for yield:", e);
                }
            }
            await tx.contractYield.upsert({
                where: { contractId },
                create: {
                    contractId,
                    estimatedQuantity,
                    actualQuantity: null,
                    unit: contract.demand.quantityUnit,
                    fulfillmentPercentage: null,
                    fulfillmentStatus: "PENDING",
                },
                update: {
                    estimatedQuantity,
                    unit: contract.demand.quantityUnit,
                },
            });
            // 4. Generate crop milestones (idempotent)
            await (0, contractHelpers_1.generateMilestonesForContract)(contractId, tx);
            // 5. Generate crop tasks (idempotent)
            await (0, taskHelpers_1.generateTasksForContract)(contractId, tx);
            return updatedContract;
        });
        return server_1.NextResponse.json({ success: true, contract: updated });
    }
    catch (error) {
        console.error("PATCH Activate Contract Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
