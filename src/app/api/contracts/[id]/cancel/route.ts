import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

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

    const { id: contractId } = await params;
    const contract = await db.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract proposal not found." }, { status: 404 });
    }

    if (contract.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this contract proposal." }, { status: 403 });
    }

    if (contract.status !== "PENDING_APPROVAL") {
      return NextResponse.json({ error: "Only pending contract proposals can be cancelled." }, { status: 400 });
    }

    const updated = await db.contract.update({
      where: { id: contractId },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({ success: true, contract: updated });
  } catch (error: any) {
    console.error("PATCH Cancel Contract Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
