import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { backfillContractTasks, getEffectiveTaskStatus, calculateTaskDaysOverdue } from "@/lib/taskHelpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contractId } = await params;

    const contract = await db.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    // Access check: User must be buyer, landowner, worker, or admin
    if (contract.buyerId !== user.id && contract.landownerId !== user.id && user.role !== "WORKER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Unauthorized access." }, { status: 403 });
    }

    // Backfill tasks if none exist
    const dbTasks = await backfillContractTasks(contractId);

    const now = new Date();
    const mappedTasks = (dbTasks || []).map((t: any) => {
      const effStatus = getEffectiveTaskStatus(t.dueDate, t.status, now);
      const daysOverdue = effStatus === "OVERDUE" ? calculateTaskDaysOverdue(t.dueDate, now) : 0;
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

    return NextResponse.json(mappedTasks);
  } catch (error: any) {
    console.error("GET Tasks Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contractId } = await params;
    const body = await request.json();
    const { taskId, status } = body;

    if (!taskId || !status) {
      return NextResponse.json({ error: "Missing taskId or status." }, { status: 400 });
    }

    // Validate status value matches enum
    const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    // Fetch the task and verify it belongs to this contract
    const task = await db.contractTask.findFirst({
      where: { id: taskId, contractId },
      include: { contract: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found for this contract." }, { status: 404 });
    }

    // Access check: Landowner, worker, or admin can update task status
    if (task.contract.landownerId !== user.id && user.role !== "WORKER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Landowner, Worker, or Admin role required." }, { status: 403 });
    }

    // Update status
    const updated = await db.contractTask.update({
      where: { id: taskId },
      data: {
        status: status as any,
      },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    console.error("PATCH Tasks Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
