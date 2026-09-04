import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuantityUnit, InspectionGrade, InspectionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "INSPECTOR" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Inspector or Admin access required." },
        { status: 403 }
      );
    }

    const receipts = await db.harvestReceipt.findMany({
      include: {
        center: true,
        contract: {
          select: {
            id: true,
            crop: { select: { id: true, name: true } },
            landowner: { select: { id: true, name: true, phone: true } },
            buyer: { select: { id: true, name: true, phone: true } },
          },
        },
        inspections: {
          include: {
            inspector: {
              select: { id: true, name: true, phone: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(receipts);
  } catch (error: any) {
    console.error("GET Inspections List Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization: INSPECTOR or ADMIN
    if (user.role !== "INSPECTOR" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Inspector or Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      receiptId,
      acceptedWeight: rawAccepted,
      rejectedWeight: rawRejected,
      unit: rawUnit,
      grade: rawGrade,
      moistureContent,
      foreignMatterPercentage,
      status: rawStatus,
      flagReason,
      samplePhotoUrlsJson,
      inspectorGpsLat,
      inspectorGpsLng,
    } = body;

    if (!receiptId || typeof receiptId !== "string") {
      return NextResponse.json({ error: "receiptId is required." }, { status: 400 });
    }

    // Validate receipt existence
    const receipt = await db.harvestReceipt.findUnique({
      where: { id: receiptId },
      include: { contract: true },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Harvest receipt not found." }, { status: 404 });
    }

    const acceptedWeight = parseFloat(rawAccepted);
    const rejectedWeight = rawRejected !== undefined && rawRejected !== null ? parseFloat(rawRejected) : 0;

    if (isNaN(acceptedWeight) || acceptedWeight < 0) {
      return NextResponse.json({ error: "Accepted weight must be a non-negative number." }, { status: 400 });
    }

    if (isNaN(rejectedWeight) || rejectedWeight < 0) {
      return NextResponse.json({ error: "Rejected weight must be a non-negative number." }, { status: 400 });
    }

    // Weight sum validation: acceptedWeight + rejectedWeight must not exceed receipt.netWeight
    if (acceptedWeight + rejectedWeight > receipt.netWeight + 0.001) {
      return NextResponse.json(
        { error: "Accepted weight + rejected weight cannot exceed receipt net weight." },
        { status: 400 }
      );
    }

    const validUnits: QuantityUnit[] = ["KG", "QUINTAL", "TONNE"];
    if (!rawUnit || !validUnits.includes(rawUnit)) {
      return NextResponse.json({ error: "Valid unit (KG, QUINTAL, TONNE) is required." }, { status: 400 });
    }

    const validGrades: InspectionGrade[] = ["GRADE_A", "GRADE_B", "GRADE_C", "REJECTED"];
    if (!rawGrade || !validGrades.includes(rawGrade)) {
      return NextResponse.json({ error: "Valid inspection grade (GRADE_A, GRADE_B, GRADE_C, REJECTED) is required." }, { status: 400 });
    }

    const validStatuses: InspectionStatus[] = ["PENDING", "PASSED", "PASSED_WITH_FLAGS", "REJECTED"];
    let status: InspectionStatus = rawStatus && validStatuses.includes(rawStatus) ? rawStatus : "PENDING";

    // Validate Moisture
    const moistNum = moistureContent !== undefined && moistureContent !== null ? parseFloat(moistureContent) : null;
    if (moistNum !== null && (isNaN(moistNum) || moistNum < 0)) {
      return NextResponse.json({ error: "Moisture content must be a non-negative number." }, { status: 400 });
    }

    // Validate Foreign Matter %
    const foreignNum = foreignMatterPercentage !== undefined && foreignMatterPercentage !== null ? parseFloat(foreignMatterPercentage) : null;
    if (foreignNum !== null && (isNaN(foreignNum) || foreignNum < 0 || foreignNum > 100)) {
      return NextResponse.json({ error: "Foreign matter percentage must be between 0 and 100." }, { status: 400 });
    }

    // Validate GPS Coordinates
    const latNum = inspectorGpsLat !== undefined && inspectorGpsLat !== null ? parseFloat(inspectorGpsLat) : null;
    const lngNum = inspectorGpsLng !== undefined && inspectorGpsLng !== null ? parseFloat(inspectorGpsLng) : null;

    if (latNum !== null && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
      return NextResponse.json({ error: "Inspector latitude must be between -90 and 90." }, { status: 400 });
    }

    if (lngNum !== null && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
      return NextResponse.json({ error: "Inspector longitude must be between -180 and 180." }, { status: 400 });
    }

    // Rule-Based Flags (System Deterministic Rules)
    const flagReasonsList: string[] = [];
    if (flagReason && flagReason.trim()) {
      flagReasonsList.push(flagReason.trim());
    }

    // Rule A: Rejected % > 10%
    const rejectedPercentage = (rejectedWeight / receipt.netWeight) * 100;
    if (rejectedPercentage > 10) {
      if (status === "PASSED") {
        status = "PASSED_WITH_FLAGS";
      }
      flagReasonsList.push(`High rejection rate: ${rejectedPercentage.toFixed(1)}% of lot weight rejected.`);
    }

    // Rule B: Deviation between evaluated total weight & receipt net weight > 15%
    const totalEvalWeight = acceptedWeight + rejectedWeight;
    const weightDeviation = (Math.abs(totalEvalWeight - receipt.netWeight) / receipt.netWeight) * 100;
    if (weightDeviation > 15) {
      if (status === "PASSED") {
        status = "PASSED_WITH_FLAGS";
      }
      flagReasonsList.push(`Weight discrepancy: evaluated total differs by ${weightDeviation.toFixed(1)}% from receipt weight.`);
    }

    if ((status === "PASSED_WITH_FLAGS" || status === "REJECTED") && flagReasonsList.length === 0) {
      return NextResponse.json(
        { error: `flagReason is required when inspection status is ${status}.` },
        { status: 400 }
      );
    }

    const finalFlagReason = flagReasonsList.length > 0 ? flagReasonsList.join(" | ") : null;

    const newInspection = await db.produceInspection.create({
      data: {
        receiptId,
        contractId: receipt.contractId,
        inspectorId: user.id,
        acceptedWeight,
        rejectedWeight,
        unit: rawUnit,
        grade: rawGrade,
        moistureContent: moistNum !== null && !isNaN(moistNum) ? moistNum : null,
        foreignMatterPercentage: foreignNum !== null && !isNaN(foreignNum) ? foreignNum : null,
        status,
        flagReason: finalFlagReason,
        samplePhotoUrlsJson: samplePhotoUrlsJson || null,
        inspectorGpsLat: latNum !== null && !isNaN(latNum) ? latNum : null,
        inspectorGpsLng: lngNum !== null && !isNaN(lngNum) ? lngNum : null,
      },
      include: {
        receipt: true,
        inspector: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
    });

    // ContractAlert Integration
    if (status === "PASSED_WITH_FLAGS" || status === "REJECTED") {
      const alertType = status === "REJECTED" ? "REJECTED_LOT" : "QUALITY_FLAG";
      const severity = status === "REJECTED" ? "CRITICAL" : "WARNING";
      const title = status === "REJECTED" ? "Harvest Lot Rejected" : "Quality Warning Flagged";
      const message = finalFlagReason || `Quality evaluation status: ${status}`;

      try {
        await db.contractAlert.upsert({
          where: {
            contractId_type_title: {
              contractId: receipt.contractId,
              type: alertType,
              title,
            },
          },
          create: {
            contractId: receipt.contractId,
            type: alertType,
            severity,
            title,
            message,
            isRead: false,
            isResolved: false,
          },
          update: {
            message,
            severity,
            isResolved: false,
            updatedAt: new Date(),
          },
        });
      } catch (alertErr) {
        console.error("ContractAlert creation error:", alertErr);
      }
    }

    // Update receipt status
    if (status === "PASSED" || status === "PASSED_WITH_FLAGS") {
      await db.harvestReceipt.update({
        where: { id: receiptId },
        data: { status: "INSPECTED" },
      });
    } else if (status === "REJECTED") {
      await db.harvestReceipt.update({
        where: { id: receiptId },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json(newInspection, { status: 201 });
  } catch (error: any) {
    console.error("POST Inspection Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
