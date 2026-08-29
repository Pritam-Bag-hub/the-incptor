"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const contractHelpers_1 = require("@/lib/contractHelpers");
const client_1 = require("@prisma/client");
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
            include: {
                milestones: {
                    orderBy: { sequence: "asc" },
                },
            },
        });
        if (!contract) {
            return server_1.NextResponse.json({ error: "Contract not found." }, { status: 404 });
        }
        // Access check: User must be buyer or landowner
        if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: Unauthorized access." }, { status: 403 });
        }
        let milestones = contract.milestones;
        if ((!milestones || milestones.length === 0) &&
            (contract.status === "ACTIVE" || contract.status === "COMPLETED")) {
            const backfilled = await (0, contractHelpers_1.backfillContractMilestones)(contractId);
            if (backfilled) {
                milestones = backfilled.sort((a, b) => a.sequence - b.sequence);
            }
        }
        const now = new Date();
        const mappedMilestones = (milestones || []).map((ms) => {
            const effStatus = (0, contractMonitoring_1.getEffectiveMilestoneStatus)(ms.plannedDate, ms.status, now);
            return {
                id: ms.id,
                contractId: ms.contractId,
                title: ms.title,
                sequence: ms.sequence,
                plannedDate: ms.plannedDate,
                completedAt: ms.completedAt,
                status: effStatus,
                daysOverdue: effStatus === "OVERDUE" ? (0, contractMonitoring_1.calculateDaysOverdue)(ms.plannedDate, now) : 0,
                createdAt: ms.createdAt,
                updatedAt: ms.updatedAt,
            };
        });
        return server_1.NextResponse.json(mappedMilestones);
    }
    catch (error) {
        console.error("GET Milestones Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
async function PATCH(request, { params }) {
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
        // Authorization: Only associated landowner can update milestones status. Buyer remains read-only.
        if (contract.landownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: Only the landowner can update milestone status." }, { status: 403 });
        }
        const body = await request.json().catch(() => ({}));
        const { milestoneId, status } = body;
        if (!milestoneId || !status) {
            return server_1.NextResponse.json({ error: "Missing milestoneId or status." }, { status: 400 });
        }
        const validStatuses = Object.values(client_1.MilestoneStatus);
        if (!validStatuses.includes(status)) {
            return server_1.NextResponse.json({ error: "Invalid status value." }, { status: 400 });
        }
        // Verify milestone belongs to specified contract
        const milestone = await db_1.db.contractMilestone.findFirst({
            where: { id: milestoneId, contractId },
        });
        if (!milestone) {
            return server_1.NextResponse.json({ error: "Milestone not found for this contract." }, { status: 404 });
        }
        const updated = await db_1.db.contractMilestone.update({
            where: { id: milestoneId },
            data: {
                status: status,
                completedAt: status === "COMPLETED" ? new Date() : null,
            },
        });
        // Recalculate monitoring/alerts state to resolve milestone overdue alerts instantly
        await (0, contractMonitoring_1.calculateContractMonitoringState)(contractId);
        return server_1.NextResponse.json({ success: true, milestone: updated });
    }
    catch (error) {
        console.error("PATCH Milestones Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
