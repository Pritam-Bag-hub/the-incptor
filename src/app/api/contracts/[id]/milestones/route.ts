import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { backfillContractMilestones } from "@/lib/contractHelpers";
import { MilestoneStatus } from "@prisma/client";
import { getEffectiveMilestoneStatus, calculateDaysOverdue, calculateContractMonitoringState } from "@/lib/contractMonitoring";

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
      include: {
        milestones: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    // Access check: User must be buyer or landowner
    if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: Unauthorized access." }, { status: 403 });
    }

    let milestones = contract.milestones;
    if (
      (!milestones || milestones.length === 0) &&
      (contract.status === "ACTIVE" || contract.status === "COMPLETED")
    ) {
      const backfilled = await backfillContractMilestones(contractId);
      if (backfilled) {
        milestones = backfilled.sort((a: any, b: any) => a.sequence - b.sequence);
      }
    }

    const now = new Date();
    const mappedMilestones = (milestones || []).map((ms: any) => {
      const effStatus = getEffectiveMilestoneStatus(ms.plannedDate, ms.status, now);
      return {
        id: ms.id,
        contractId: ms.contractId,
        title: ms.title,
        sequence: ms.sequence,
        plannedDate: ms.plannedDate,
        completedAt: ms.completedAt,
        status: effStatus,
        daysOverdue: effStatus === "OVERDUE" ? calculateDaysOverdue(ms.plannedDate, now) : 0,
        createdAt: ms.createdAt,
        updatedAt: ms.updatedAt,
      };
    });

    return NextResponse.json(mappedMilestones);
  } catch (error: any) {
    console.error("GET Milestones Error:", error);
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

    const contract = await db.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    // Authorization: Only associated landowner can update milestones status. Buyer remains read-only.
    if (contract.landownerId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the landowner can update milestone status." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { milestoneId, status } = body;

    if (!milestoneId || !status) {
      return NextResponse.json({ error: "Missing milestoneId or status." }, { status: 400 });
    }

    const validStatuses = Object.values(MilestoneStatus);
    if (!validStatuses.includes(status as any)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    // Verify milestone belongs to specified contract
    const milestone = await db.contractMilestone.findFirst({
      where: { id: milestoneId, contractId },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found for this contract." }, { status: 404 });
    }

    const updated = await db.contractMilestone.update({
      where: { id: milestoneId },
      data: {
        status: status as MilestoneStatus,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    // Recalculate monitoring/alerts state to resolve milestone overdue alerts instantly
    await calculateContractMonitoringState(contractId);

    return NextResponse.json({ success: true, milestone: updated });
  } catch (error: any) {
    console.error("PATCH Milestones Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
