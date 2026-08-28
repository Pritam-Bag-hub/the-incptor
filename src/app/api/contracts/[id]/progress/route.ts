import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { FarmProgressStage } from "@prisma/client";

export async function POST(
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
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    // Verify ownership
    if (contract.landownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You are not authorized to update progress on this contract." }, { status: 403 });
    }

    // Verify contract is ACTIVE
    if (contract.status !== "ACTIVE") {
      return NextResponse.json({ error: "Farming progress can only be updated on ACTIVE contracts." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { stage, notes } = body;

    // Validate stage
    if (!stage || !Object.values(FarmProgressStage).includes(stage)) {
      return NextResponse.json({ error: `Invalid stage specified. Must be one of: ${Object.values(FarmProgressStage).join(", ")}` }, { status: 400 });
    }

    const trimmedNotes = notes ? String(notes).trim() : null;

    const progress = await db.farmProgress.create({
      data: {
        contractId,
        stage: stage as FarmProgressStage,
        notes: trimmedNotes,
      },
    });

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error("POST Contract Progress Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
