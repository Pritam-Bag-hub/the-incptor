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
                financialAllocation: true,
            },
        });
        if (!contract) {
            return server_1.NextResponse.json({ error: "Contract not found." }, { status: 404 });
        }
        // Access check: User must be buyer or landowner
        if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: Unauthorized access." }, { status: 403 });
        }
        let allocation = contract.financialAllocation;
        if (!allocation) {
            allocation = await (0, contractHelpers_1.backfillFinancialAllocation)(contractId);
        }
        if (!allocation) {
            return server_1.NextResponse.json({ error: "Financial allocation not configured yet." }, { status: 404 });
        }
        return server_1.NextResponse.json(allocation);
    }
    catch (error) {
        console.error("GET Financials Error:", error);
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
        });
        if (!contract) {
            return server_1.NextResponse.json({ error: "Contract not found." }, { status: 404 });
        }
        // Authorization: Only associated Buyer can edit financials
        if (contract.buyerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: Only the associated buyer can configure financials." }, { status: 403 });
        }
        // Status constraint: Must be ACCEPTED or ACTIVE
        if (contract.status !== "ACCEPTED" && contract.status !== "ACTIVE") {
            return server_1.NextResponse.json({ error: "Financial allocations can only be configured for ACCEPTED or ACTIVE contracts." }, { status: 400 });
        }
        const body = await request.json().catch(() => ({}));
        const landownerAmount = parseFloat(body.landownerAmount || 0);
        const workforceBudget = parseFloat(body.workforceBudget || 0);
        const logisticsBudget = parseFloat(body.logisticsBudget || 0);
        const platformFee = parseFloat(body.platformFee || 0);
        const reserveBudget = parseFloat(body.reserveBudget || 0);
        if (landownerAmount < 0 ||
            workforceBudget < 0 ||
            logisticsBudget < 0 ||
            platformFee < 0 ||
            reserveBudget < 0) {
            return server_1.NextResponse.json({ error: "Budget components cannot be negative." }, { status: 400 });
        }
        const totalAllocated = landownerAmount + workforceBudget + logisticsBudget + platformFee + reserveBudget;
        const expectedValue = contract.proposedPrice;
        // Check with floating-point tolerance of 0.01
        if (Math.abs(totalAllocated - expectedValue) >= 0.01) {
            return server_1.NextResponse.json({
                error: `Total allocations (${totalAllocated}) must sum up to the agreed contract value (${expectedValue}).`
            }, { status: 400 });
        }
        const allocation = await db_1.db.contractFinancialAllocation.upsert({
            where: { contractId },
            create: {
                contractId,
                totalContractValue: expectedValue,
                landownerAmount,
                workforceBudget,
                logisticsBudget,
                platformFee,
                reserveBudget,
                isConfigured: true,
                currency: "INR",
            },
            update: {
                totalContractValue: expectedValue,
                landownerAmount,
                workforceBudget,
                logisticsBudget,
                platformFee,
                reserveBudget,
                isConfigured: true,
            },
        });
        return server_1.NextResponse.json({ success: true, financialAllocation: allocation });
    }
    catch (error) {
        console.error("Update Financials Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
