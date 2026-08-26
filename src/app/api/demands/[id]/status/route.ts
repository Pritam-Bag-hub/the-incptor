import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BuyerDemandStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "BUYER") {
      return NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
    }

    const { id } = await params;
    const demand = await db.buyerDemand.findUnique({
      where: { id },
    });

    if (!demand) {
      return NextResponse.json({ error: "Demand not found" }, { status: 404 });
    }

    if (demand.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (
      status !== "DRAFT" &&
      status !== "ACTIVE" &&
      status !== "PAUSED" &&
      status !== "CLOSED"
    ) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const updatedDemand = await db.buyerDemand.update({
      where: { id },
      data: {
        status: status as BuyerDemandStatus,
      },
    });

    return NextResponse.json({ success: true, status: updatedDemand.status });
  } catch (error: any) {
    console.error("PATCH Demand Status Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
