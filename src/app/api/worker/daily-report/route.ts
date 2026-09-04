import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find active worker assignment
    const activeContract = await db.workerContract.findFirst({
      where: {
        workerId: user.id,
        status: "ACTIVE",
      },
      include: {
        land: true,
        crop: true,
        landowner: {
          select: { id: true, name: true, phone: true },
        },
        farmingContract: {
          select: { id: true, status: true, landArea: true, startDate: true, expectedHarvestDate: true },
        },
      },
    });

    if (!activeContract) {
      return NextResponse.json({
        activeAssignment: null,
        report: null,
        todayTasks: [],
      });
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Fetch or find today's report for this assignment
    const report = await db.workerDailyReport.findUnique({
      where: {
        workerContractId_date: {
          workerContractId: activeContract.id,
          date: todayDate,
        },
      },
    });

    // Fetch planned tasks for the farming contract
    const allTasks = await db.contractTask.findMany({
      where: {
        contractId: activeContract.farmingContractId,
      },
      orderBy: [{ sequence: "asc" }],
      include: {
        milestone: {
          select: { title: true },
        },
      },
    });

    // Identify today's planned tasks:
    // 1) Tasks matching today's date if dueDate or plannedStart is set
    let todayTasks = allTasks.filter((t) => {
      if (t.plannedStart || t.dueDate) {
        const pDate = new Date(t.plannedStart || t.dueDate!);
        pDate.setHours(0, 0, 0, 0);
        return pDate.getTime() === todayDate.getTime();
      }
      return false;
    });

    // Fallback: If no tasks stamped specifically with today's date, return pending/in-progress tasks (up to 4)
    if (todayTasks.length === 0 && allTasks.length > 0) {
      todayTasks = allTasks.filter((t) => t.status !== "COMPLETED").slice(0, 4);
    }

    return NextResponse.json({
      activeAssignment: activeContract,
      report,
      todayTasks,
      allTasks,
    });
  } catch (error: any) {
    console.error("GET Worker Daily Report Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
