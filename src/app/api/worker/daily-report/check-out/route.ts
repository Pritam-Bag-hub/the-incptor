import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
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
        { error: "Forbidden: You must be assigned to an active contract to check out." },
        { status: 403 }
      );
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const now = new Date();

    const existingReport = await db.workerDailyReport.findUnique({
      where: {
        workerContractId_date: {
          workerContractId: activeContract.id,
          date: todayDate,
        },
      },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: "Cannot check out before checking in." },
        { status: 400 }
      );
    }

    const report = await db.workerDailyReport.update({
      where: {
        id: existingReport.id,
      },
      data: {
        checkOutAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("POST Worker Check-Out Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
