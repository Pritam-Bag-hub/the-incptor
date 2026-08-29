"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
async function POST(request) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "BUYER") {
            return server_1.NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
        }
        const body = await request.json();
        const { demandId, landId, proposedPrice, startDate, expectedHarvestDate, notes } = body;
        // 1. Basic validation
        if (!demandId || !landId || proposedPrice === undefined || !startDate || !expectedHarvestDate) {
            return server_1.NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }
        const price = parseFloat(proposedPrice);
        if (isNaN(price) || price <= 0) {
            return server_1.NextResponse.json({ error: "Proposed price must be a positive number." }, { status: 400 });
        }
        const start = new Date(startDate);
        const end = new Date(expectedHarvestDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            return server_1.NextResponse.json({ error: "Invalid timeline dates specified." }, { status: 400 });
        }
        // 2. Verify demand ownership
        const demand = await db_1.db.buyerDemand.findUnique({
            where: { id: demandId },
        });
        if (!demand) {
            return server_1.NextResponse.json({ error: "Demand profile not found." }, { status: 404 });
        }
        if (demand.buyerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this demand." }, { status: 403 });
        }
        // 3. Verify land status
        const land = await db_1.db.land.findUnique({
            where: { id: landId },
        });
        if (!land) {
            return server_1.NextResponse.json({ error: "Land parcel not found." }, { status: 404 });
        }
        if (land.status !== "AVAILABLE") {
            return server_1.NextResponse.json({ error: "Land is not available for proposals." }, { status: 409 });
        }
        // 4. Verify selection exists
        const selection = await db_1.db.demandLandSelection.findUnique({
            where: {
                demandId_landId: {
                    demandId,
                    landId,
                },
            },
        });
        if (!selection) {
            return server_1.NextResponse.json({ error: "You must select this land first before proposing a contract." }, { status: 400 });
        }
        // 5. Check if contract already exists for this (demandId + landId)
        const existingContract = await db_1.db.contract.findUnique({
            where: {
                demandId_landId: {
                    demandId,
                    landId,
                },
            },
        });
        // 6. Calculate allocatedQuantity using crop expected yield from metadata
        let allocatedQuantity = land.size; // Default fallback
        const crop = await db_1.db.crop.findUnique({
            where: { id: demand.cropId },
        });
        if (crop?.metadataJson) {
            try {
                const meta = JSON.parse(crop.metadataJson);
                const yieldPerAcre = parseFloat(meta.expectedYieldPerAcre);
                if (!isNaN(yieldPerAcre) && yieldPerAcre > 0) {
                    allocatedQuantity = yieldPerAcre * land.size;
                }
            }
            catch (e) {
                console.error("Error parsing crop metadata yield:", e);
            }
        }
        if (existingContract) {
            if (existingContract.status !== "REJECTED" && existingContract.status !== "CANCELLED") {
                return server_1.NextResponse.json({ error: "A contract proposal already exists for this selected land." }, { status: 409 });
            }
            // Check ownership
            if (existingContract.buyerId !== user.id) {
                return server_1.NextResponse.json({ error: "Forbidden: You do not own the existing contract." }, { status: 403 });
            }
            // Inplace revision: copy current state into ContractHistory and update Contract
            const updatedContract = await db_1.db.$transaction(async (tx) => {
                // Create history log entry
                await tx.contractHistory.create({
                    data: {
                        contractId: existingContract.id,
                        revision: existingContract.revision,
                        landArea: existingContract.landArea,
                        allocatedQuantity: existingContract.allocatedQuantity,
                        proposedPrice: existingContract.proposedPrice,
                        startDate: existingContract.startDate,
                        expectedHarvestDate: existingContract.expectedHarvestDate,
                        status: existingContract.status,
                        notes: existingContract.notes,
                        rejectionReason: existingContract.rejectionReason,
                        decisionDate: existingContract.decisionDate,
                        activatedAt: existingContract.activatedAt,
                        completedAt: existingContract.completedAt,
                    },
                });
                // Update contract with new values
                const updated = await tx.contract.update({
                    where: { id: existingContract.id },
                    data: {
                        revision: existingContract.revision + 1,
                        landArea: land.size,
                        allocatedQuantity,
                        proposedPrice: price,
                        startDate: start,
                        expectedHarvestDate: end,
                        status: "PENDING_APPROVAL",
                        notes: notes || null,
                        rejectionReason: null,
                        decisionDate: null,
                        activatedAt: null,
                        completedAt: null,
                    },
                });
                return updated;
            });
            return server_1.NextResponse.json({ success: true, contract: updatedContract });
        }
        // 7. Create contract
        const contract = await db_1.db.contract.create({
            data: {
                demandId,
                landId,
                buyerId: user.id,
                landownerId: land.ownerId,
                cropId: demand.cropId,
                landArea: land.size,
                allocatedQuantity,
                proposedPrice: price,
                startDate: start,
                expectedHarvestDate: end,
                status: "PENDING_APPROVAL",
                notes: notes || null,
            },
        });
        return server_1.NextResponse.json({ success: true, contract });
    }
    catch (error) {
        console.error("POST Contract Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
async function GET(request) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "BUYER") {
            return server_1.NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const demandId = searchParams.get("demandId");
        const queryConditions = {
            buyerId: user.id,
        };
        if (demandId) {
            queryConditions.demandId = demandId;
        }
        const contracts = await db_1.db.contract.findMany({
            where: queryConditions,
            include: {
                land: true,
                crop: {
                    include: {
                        category: true,
                    },
                },
                landowner: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return server_1.NextResponse.json(contracts);
    }
    catch (error) {
        console.error("GET Contracts Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
