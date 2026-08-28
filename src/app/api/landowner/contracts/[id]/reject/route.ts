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

    if (user.role !== "LANDOWNER") {
      return NextResponse.json({ error: "Forbidden: Landowner role required" }, { status: 403 });
    }

    const { id: contractId } = await params;
    const contract = await db.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract proposal not found." }, { status: 404 });
    }

    if (contract.landownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own the land associated with this contract." }, { status: 403 });
    }

    if (contract.status !== "PENDING_APPROVAL") {
      return NextResponse.json({ error: "Only pending contract proposals can be rejected." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.rejectionReason || body.notes;

    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
    }

    const updated = await db.contract.update({
      where: { id: contractId },
      data: {
        status: "REJECTED",
        decisionDate: new Date(),
        rejectionReason: reason.trim(),
      },
    });

    return NextResponse.json({ success: true, contract: updated });
  } catch (error: any) {
    console.error("PATCH Reject Contract Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
