import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateContractMonitoringState } from "@/lib/contractMonitoring";

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

    // Access check: User must be buyer or landowner
    if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: Unauthorized access." }, { status: 403 });
    }

    // Synchronize monitoring states and retrieve alerts
    const state = await calculateContractMonitoringState(contractId);
    if (!state) {
      return NextResponse.json({ error: "Failed to calculate monitoring state." }, { status: 500 });
    }

    return NextResponse.json(state.alerts);
  } catch (error: any) {
    console.error("GET Alerts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
