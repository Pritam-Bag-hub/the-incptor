import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeContract = await db.workerContract.findFirst({
      where: {
        workerId: user.id,
        status: "ACTIVE",
      },
    });

    if (!activeContract) {
      return NextResponse.json(
        { error: "Forbidden: You must be assigned to an active contract to submit daily work." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { status, issueType, notes } = body;

    if (!status || !["COMPLETED", "PARTIAL", "NOT_COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status (COMPLETED, PARTIAL, or NOT_COMPLETED) is required." },
        { status: 400 }
      );
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const now = new Date();

    // Check existing report
    const existingReport = await db.workerDailyReport.findUnique({
      where: {
        workerContractId_date: {
          workerContractId: activeContract.id,
          date: todayDate,
        },
      },
    });

    if (existingReport && existingReport.submittedAt) {
      return NextResponse.json(
        { error: "Today's work report has already been submitted and cannot be submitted repeatedly." },
        { status: 400 }
      );
    }

    // Upsert report
    const report = await db.workerDailyReport.upsert({
      where: {
        workerContractId_date: {
          workerContractId: activeContract.id,
          date: todayDate,
        },
      },
      create: {
        workerId: user.id,
        workerContractId: activeContract.id,
        date: todayDate,
        status: status as any,
        checkInAt: existingReport?.checkInAt || now,
        submittedAt: now,
        issueType: issueType || null,
        notes: notes || null,
      },
      update: {
        status: status as any,
        submittedAt: now,
        issueType: issueType || null,
        notes: notes || null,
      },
    });

    let updatedTaskCount = 0;

    // Server-side task completion logic
    if (status === "COMPLETED") {
      const allTasks = await db.contractTask.findMany({
        where: { contractId: activeContract.farmingContractId },
      });

      // Find planned tasks for today
      let tasksToComplete = allTasks.filter((t) => {
        if (t.plannedStart || t.dueDate) {
          const pDate = new Date(t.plannedStart || t.dueDate!);
          pDate.setHours(0, 0, 0, 0);
          return pDate.getTime() === todayDate.getTime() && t.status !== "COMPLETED";
        }
        return false;
      });

      // Fallback: If no tasks stamped with today's date, complete non-completed tasks (up to 3)
      if (tasksToComplete.length === 0 && allTasks.length > 0) {
        tasksToComplete = allTasks.filter((t) => t.status !== "COMPLETED").slice(0, 3);
      }

      if (tasksToComplete.length > 0) {
        await db.contractTask.updateMany({
          where: {
            id: { in: tasksToComplete.map((t) => t.id) },
          },
          data: {
            status: "COMPLETED",
          },
        });
        updatedTaskCount = tasksToComplete.length;
      }
    } else if (status === "PARTIAL") {
      // Create warning alert for landowner
      const titleStr = `Daily Field Work Partially Completed (${issueType || "Issues Reported"})`;
      await db.contractAlert.upsert({
        where: {
          contractId_type_title: {
            contractId: activeContract.farmingContractId,
            type: "PROGRESS_DELAY",
            title: titleStr,
          },
        },
        create: {
          contractId: activeContract.farmingContractId,
          type: "PROGRESS_DELAY",
          severity: "WARNING",
          title: titleStr,
          message: notes ? `Worker notes: ${notes}` : `Worker reported partial completion due to: ${issueType || "Field issue"}.`,
        },
        update: {
          severity: "WARNING",
          message: notes ? `Worker notes: ${notes}` : `Worker reported partial completion due to: ${issueType || "Field issue"}.`,
        },
      });
    } else if (status === "NOT_COMPLETED") {
      // Create critical alert for landowner
      const titleStr = `Daily Field Work Could Not Be Completed (${issueType || "Blocker Observed"})`;
      await db.contractAlert.upsert({
        where: {
          contractId_type_title: {
            contractId: activeContract.farmingContractId,
            type: "PROGRESS_DELAY",
            title: titleStr,
          },
        },
        create: {
          contractId: activeContract.farmingContractId,
          type: "PROGRESS_DELAY",
          severity: "CRITICAL",
          title: titleStr,
          message: notes ? `Worker notes: ${notes}` : `Worker could not perform work due to: ${issueType || "Unforeseen blocker"}.`,
        },
        update: {
          severity: "CRITICAL",
          message: notes ? `Worker notes: ${notes}` : `Worker could not perform work due to: ${issueType || "Unforeseen blocker"}.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report,
      updatedTaskCount,
    });
  } catch (error: any) {
    console.error("POST Worker Submit Work Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
