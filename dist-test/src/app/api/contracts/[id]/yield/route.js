"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PATCH = PATCH;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const contractHelpers_1 = require("@/lib/contractHelpers");
async function GET(request, { params }) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: contractId } = await params;
        const contract = await db_1.db.contract.findUnique({
            where: { id: contractId },
            include: {
                yield: true,
            },
        });
        if (!contract) {
            return server_1.NextResponse.json({ error: "Contract not found." }, { status: 404 });
        }
        // Access check: User must be buyer or landowner
        if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: Unauthorized access." }, { status: 403 });
        }
        let yieldRecord = contract.yield;
        if (!yieldRecord) {
            yieldRecord = await (0, contractHelpers_1.backfillContractYield)(contractId);
        }
        if (!yieldRecord) {
            return server_1.NextResponse.json({ error: "Yield record not found." }, { status: 404 });
        }
        return server_1.NextResponse.json(yieldRecord);
    }
    catch (error) {
        console.error("GET Yield Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
async function POST(request, { params }) {
    return handleUpdate(request, params);
}
async function PATCH(request, { params }) {
    return handleUpdate(request, params);
}
async function handleUpdate(request, params) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: contractId } = await params;
        const contract = await db_1.db.contract.findUnique({
            where: { id: contractId },
            include: {
                demand: true,
            },
        });
        if (!contract) {
            return server_1.NextResponse.json({ error: "Contract not found." }, { status: 404 });
        }
        // Authorization: Only associated landowner can record yield
        if (contract.landownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: Only the associated landowner can submit actual yield." }, { status: 403 });
        }
        // Contract must be ACTIVE
        if (contract.status !== "ACTIVE") {
            return server_1.NextResponse.json({ error: "Harvest yield can only be submitted for ACTIVE contracts." }, { status: 400 });
        }
        // Check if progress has reached HARVEST_READY or HARVEST_COMPLETED
        const harvestProgress = await db_1.db.farmProgress.findFirst({
            where: {
                contractId,
                stage: {
                    in: ["HARVEST_READY", "HARVEST_COMPLETED"],
                },
            },
        });
        if (!harvestProgress) {
            return server_1.NextResponse.json({ error: "Harvest quantity cannot be submitted until farm progress reaches HARVEST_READY or HARVEST_COMPLETED." }, { status: 400 });
        }
        const body = await request.json().catch(() => ({}));
        const actualQuantity = parseFloat(body.actualQuantity);
        if (isNaN(actualQuantity) || actualQuantity < 0) {
            return server_1.NextResponse.json({ error: "Actual quantity must be a non-negative number." }, { status: 400 });
        }
        const result = await db_1.db.$transaction(async (tx) => {
            // Find or create current yield record
            let yieldRecord = await tx.contractYield.findUnique({
                where: { contractId },
            });
            if (!yieldRecord) {
                yieldRecord = await (0, contractHelpers_1.backfillContractYield)(contractId, tx);
            }
            if (!yieldRecord) {
                // If not found, create one
                yieldRecord = await tx.contractYield.create({
                    data: {
                        contractId,
                        unit: contract.demand.quantityUnit,
                        estimatedQuantity: null,
                    },
                });
            }
            let fulfillmentPercentage = null;
            let status = "PENDING";
            if (yieldRecord.estimatedQuantity !== null && yieldRecord.estimatedQuantity > 0) {
                fulfillmentPercentage = (actualQuantity / yieldRecord.estimatedQuantity) * 100;
                if (fulfillmentPercentage < 90) {
                    status = "PARTIAL";
                }
                else if (fulfillmentPercentage >= 90 && fulfillmentPercentage <= 110) {
                    status = "FULFILLED";
                }
                else {
                    status = "OVERFULFILLED";
                }
            }
            else {
                // Yield metadata was unavailable, so fulfillment percentage is not calculable
                fulfillmentPercentage = null;
                status = "PENDING";
            }
            const updatedYield = await tx.contractYield.update({
                where: { contractId },
                data: {
                    actualQuantity,
                    fulfillmentPercentage,
                    fulfillmentStatus: status,
                },
            });
            return updatedYield;
        });
        return server_1.NextResponse.json({ success: true, yield: result });
    }
    catch (error) {
        console.error("Update Yield Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
