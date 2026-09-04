import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify worker has an active contract assignment
    const activeContract = await db.workerContract.findFirst({
      where: {
        workerId: user.id,
        status: "ACTIVE",
      },
    });

    if (!activeContract) {
      return NextResponse.json(
        { error: "Forbidden: You must be assigned to an active field contract before checking in." },
        { status: 403 }
      );
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const now = new Date();

    // Upsert today's report with check-in timestamp
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
        checkInAt: now,
      },
      update: {
        checkInAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("POST Worker Check-In Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
