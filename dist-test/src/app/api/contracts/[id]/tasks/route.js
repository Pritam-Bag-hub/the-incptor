"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const taskHelpers_1 = require("@/lib/taskHelpers");
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
        // Backfill tasks if none exist
        const dbTasks = await (0, taskHelpers_1.backfillContractTasks)(contractId);
        const now = new Date();
        const mappedTasks = (dbTasks || []).map((t) => {
            const effStatus = (0, taskHelpers_1.getEffectiveTaskStatus)(t.dueDate, t.status, now);
            const daysOverdue = effStatus === "OVERDUE" ? (0, taskHelpers_1.calculateTaskDaysOverdue)(t.dueDate, now) : 0;
            return {
                id: t.id,
                contractId: t.contractId,
                milestoneId: t.milestoneId,
                title: t.title,
                description: t.description,
                sequence: t.sequence,
                plannedStart: t.plannedStart,
                dueDate: t.dueDate,
                priority: t.priority,
                status: effStatus, // Dynamically return effective status
                storedStatus: t.status, // Stored database status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
                daysOverdue,
                estimatedWorkHours: t.estimatedWorkHours,
                milestone: {
                    id: t.milestone.id,
                    title: t.milestone.title,
                    sequence: t.milestone.sequence,
                    status: t.milestone.status,
                },
            };
        });
        return server_1.NextResponse.json(mappedTasks);
    }
    catch (error) {
        console.error("GET Tasks Error:", error);
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
        const body = await request.json();
        const { taskId, status } = body;
        if (!taskId || !status) {
            return server_1.NextResponse.json({ error: "Missing taskId or status." }, { status: 400 });
        }
        // Validate status value matches enum
        const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            return server_1.NextResponse.json({ error: "Invalid status value." }, { status: 400 });
        }
        // Fetch the task and verify it belongs to this contract
        const task = await db_1.db.contractTask.findFirst({
            where: { id: taskId, contractId },
            include: { contract: true },
        });
        if (!task) {
            return server_1.NextResponse.json({ error: "Task not found for this contract." }, { status: 404 });
        }
        // Access check: Only the landowner of this contract can update task status
        if (task.contract.landownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: Only the associated Landowner can modify tasks." }, { status: 403 });
        }
        // Update status
        const updated = await db_1.db.contractTask.update({
            where: { id: taskId },
            data: {
                status: status,
            },
        });
        return server_1.NextResponse.json({ success: true, task: updated });
    }
    catch (error) {
        console.error("PATCH Tasks Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
