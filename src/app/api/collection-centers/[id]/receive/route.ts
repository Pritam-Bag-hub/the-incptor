import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuantityUnit } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization check: CENTER_MANAGER or ADMIN
    if (user.role !== "CENTER_MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Center Manager or Admin access required." },
        { status: 403 }
      );
    }

    const { id: centerId } = await params;

    // Find collection center
    const center = await db.collectionCenter.findUnique({
      where: { id: centerId },
    });

    if (!center) {
      return NextResponse.json({ error: "Collection center not found." }, { status: 404 });
    }

    if (!center.isActive) {
      return NextResponse.json({ error: "Collection center is inactive." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      contractId,
      yieldId,
      grossWeight: rawGross,
      tareWeight: rawTare,
      unit: rawUnit,
      receiptPhotoUrl,
      notes,
    } = body;

    if (!contractId || typeof contractId !== "string") {
      return NextResponse.json({ error: "contractId is required." }, { status: 400 });
    }

    if (!yieldId || typeof yieldId !== "string") {
      return NextResponse.json({ error: "yieldId is required." }, { status: 400 });
    }

    const grossWeight = parseFloat(rawGross);
    const tareWeight = parseFloat(rawTare);

    if (isNaN(grossWeight) || grossWeight <= 0) {
      return NextResponse.json({ error: "Gross weight must be a positive number." }, { status: 400 });
    }

    if (isNaN(tareWeight) || tareWeight < 0) {
      return NextResponse.json({ error: "Tare weight must be a non-negative number." }, { status: 400 });
    }

    if (tareWeight >= grossWeight) {
      return NextResponse.json(
        { error: "Tare weight must be strictly less than gross weight." },
        { status: 400 }
      );
    }

    const netWeight = grossWeight - tareWeight;
    if (netWeight <= 0) {
      return NextResponse.json({ error: "Net weight must be greater than zero." }, { status: 400 });
    }

    // Validate Unit
    const validUnits: QuantityUnit[] = ["KG", "QUINTAL", "TONNE"];
    const unit: QuantityUnit = validUnits.includes(rawUnit) ? rawUnit : "TONNE";

    // Validate Contract and Yield
    const contract = await db.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    if (contract.status !== "ACTIVE" && contract.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Harvest receiving is only permitted for ACTIVE or COMPLETED contracts." },
        { status: 400 }
      );
    }

    const yieldRecord = await db.contractYield.findUnique({
      where: { id: yieldId },
    });

    if (!yieldRecord) {
      return NextResponse.json({ error: "Yield record not found." }, { status: 404 });
    }

    if (yieldRecord.contractId !== contractId) {
      return NextResponse.json(
        { error: "Yield record does not belong to the specified contract." },
        { status: 400 }
      );
    }

    // Collision-safe receipt number generation
    const count = await db.harvestReceipt.count();
    const sequenceNum = (count + 1).toString().padStart(5, "0");
    const year = new Date().getFullYear();
    const receiptNumber = `REC-${year}-${sequenceNum}`;

    const newReceipt = await db.harvestReceipt.create({
      data: {
        receiptNumber,
        contractId,
        yieldId,
        centerId,
        receivedByUserId: user.id,
        grossWeight,
        tareWeight,
        netWeight,
        unit,
        status: "RECEIVED",
        receiptPhotoUrl: receiptPhotoUrl || null,
        notes: notes || null,
      },
      include: {
        center: true,
        receivedByUser: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
    });

    return NextResponse.json(newReceipt, { status: 201 });
  } catch (error: any) {
    console.error("Harvest Receive Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
