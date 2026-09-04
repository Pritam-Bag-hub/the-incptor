import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { InspectionStatus, InspectionGrade, QuantityUnit } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: inspectionId } = await params;

    const inspection = await db.produceInspection.findUnique({
      where: { id: inspectionId },
      include: {
        receipt: {
          include: {
            center: true,
          },
        },
        contract: {
          select: {
            id: true,
            buyerId: true,
            landownerId: true,
            landArea: true,
            allocatedQuantity: true,
            proposedPrice: true,
            crop: { select: { id: true, name: true } },
            land: { select: { id: true, name: true, village: true, district: true } },
          },
        },
        inspector: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found." }, { status: 404 });
    }

    // Authorization: related buyer, landowner, INSPECTOR, CENTER_MANAGER, or ADMIN
    const isBuyer = inspection.contract.buyerId === user.id;
    const isLandowner = inspection.contract.landownerId === user.id;
    const isInspector = user.role === "INSPECTOR";
    const isCenterManager = user.role === "CENTER_MANAGER";
    const isAdmin = user.role === "ADMIN";

    if (!isBuyer && !isLandowner && !isInspector && !isCenterManager && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Access denied." }, { status: 403 });
    }

    // Fetch previous audit history for the same receipt
    const previousInspections = await db.produceInspection.findMany({
      where: {
        receiptId: inspection.receiptId,
        id: { not: inspection.id },
      },
      include: {
        inspector: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ...inspection,
      previousInspections,
    });
  } catch (error: any) {
    console.error("GET Inspection Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization: INSPECTOR or ADMIN
    if (user.role !== "INSPECTOR" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Inspector or Admin access required." }, { status: 403 });
    }

    const { id: inspectionId } = await params;

    const existingInspection = await db.produceInspection.findUnique({
      where: { id: inspectionId },
      include: { receipt: true },
    });

    if (!existingInspection) {
      return NextResponse.json({ error: "Inspection record not found." }, { status: 404 });
    }

    // Preserve Audit History: Do not overwrite completed evaluations
    if (existingInspection.status !== "PENDING") {
      return NextResponse.json(
        {
          error: "Completed inspections cannot be overwritten. Submit a new inspection to record a re-inspection audit.",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
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

    const acceptedWeight = rawAccepted !== undefined ? parseFloat(rawAccepted) : existingInspection.acceptedWeight;
    const rejectedWeight = rawRejected !== undefined ? parseFloat(rawRejected) : existingInspection.rejectedWeight;

    if (isNaN(acceptedWeight) || acceptedWeight < 0) {
      return NextResponse.json({ error: "Accepted weight must be a non-negative number." }, { status: 400 });
    }

    if (isNaN(rejectedWeight) || rejectedWeight < 0) {
      return NextResponse.json({ error: "Rejected weight must be a non-negative number." }, { status: 400 });
    }

    if (acceptedWeight + rejectedWeight > existingInspection.receipt.netWeight + 0.001) {
      return NextResponse.json(
        { error: "Accepted weight + rejected weight cannot exceed receipt net weight." },
        { status: 400 }
      );
    }

    const validStatuses: InspectionStatus[] = ["PENDING", "PASSED", "PASSED_WITH_FLAGS", "REJECTED"];
    let status: InspectionStatus = rawStatus && validStatuses.includes(rawStatus) ? rawStatus : existingInspection.status;

    // Rule-Based Flags
    const flagReasonsList: string[] = [];
    if (flagReason && flagReason.trim()) {
      flagReasonsList.push(flagReason.trim());
    }

    const rejectedPercentage = (rejectedWeight / existingInspection.receipt.netWeight) * 100;
    if (rejectedPercentage > 10) {
      if (status === "PASSED") status = "PASSED_WITH_FLAGS";
      flagReasonsList.push(`High rejection rate: ${rejectedPercentage.toFixed(1)}% of lot weight rejected.`);
    }

    const totalEvalWeight = acceptedWeight + rejectedWeight;
    const weightDeviation = (Math.abs(totalEvalWeight - existingInspection.receipt.netWeight) / existingInspection.receipt.netWeight) * 100;
    if (weightDeviation > 15) {
      if (status === "PASSED") status = "PASSED_WITH_FLAGS";
      flagReasonsList.push(`Weight discrepancy: evaluated total differs by ${weightDeviation.toFixed(1)}% from receipt weight.`);
    }

    if ((status === "PASSED_WITH_FLAGS" || status === "REJECTED") && flagReasonsList.length === 0) {
      return NextResponse.json(
        { error: `flagReason is required when inspection status is ${status}.` },
        { status: 400 }
      );
    }

    const finalFlagReason = flagReasonsList.length > 0 ? flagReasonsList.join(" | ") : null;

    const updatedInspection = await db.produceInspection.update({
      where: { id: inspectionId },
      data: {
        acceptedWeight,
        rejectedWeight,
        unit: rawUnit || existingInspection.unit,
        grade: rawGrade || existingInspection.grade,
        moistureContent: moistureContent !== undefined ? parseFloat(moistureContent) : existingInspection.moistureContent,
        foreignMatterPercentage: foreignMatterPercentage !== undefined ? parseFloat(foreignMatterPercentage) : existingInspection.foreignMatterPercentage,
        status,
        flagReason: finalFlagReason,
        samplePhotoUrlsJson: samplePhotoUrlsJson || existingInspection.samplePhotoUrlsJson,
        inspectorGpsLat: inspectorGpsLat !== undefined ? parseFloat(inspectorGpsLat) : existingInspection.inspectorGpsLat,
        inspectorGpsLng: inspectorGpsLng !== undefined ? parseFloat(inspectorGpsLng) : existingInspection.inspectorGpsLng,
        inspectedAt: new Date(),
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
              contractId: existingInspection.contractId,
              type: alertType,
              title,
            },
          },
          create: {
            contractId: existingInspection.contractId,
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
      } catch (err) {
        console.error("Alert upsert error:", err);
      }
    }

    // Receipt Status Synchronization
    if (status === "PASSED" || status === "PASSED_WITH_FLAGS") {
      await db.harvestReceipt.update({
        where: { id: existingInspection.receiptId },
        data: { status: "INSPECTED" },
      });
    } else if (status === "REJECTED") {
      await db.harvestReceipt.update({
        where: { id: existingInspection.receiptId },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json(updatedInspection);
  } catch (error: any) {
    console.error("PATCH Inspection Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
