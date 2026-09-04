import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

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

    // Authorization: buyer, landowner, CENTER_MANAGER, or ADMIN
    const isBuyer = contract.buyerId === user.id;
    const isLandowner = contract.landownerId === user.id;
    const isCenterManager = user.role === "CENTER_MANAGER";
    const isAdmin = user.role === "ADMIN";

    if (!isBuyer && !isLandowner && !isCenterManager && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Access denied." }, { status: 403 });
    }

    const receipts = await db.harvestReceipt.findMany({
      where: { contractId },
      include: {
        center: true,
        receivedByUser: {
          select: { id: true, name: true, phone: true, role: true },
        },
        inspections: {
          include: {
            inspector: {
              select: { id: true, name: true, phone: true, role: true },
            },
          },
        },
        shipmentItems: {
          include: {
            shipment: {
              select: {
                id: true,
                shipmentCode: true,
                status: true,
                totalWeight: true,
                weightUnit: true,
                destinationAddress: true,
                vehicle: {
                  select: { vehicleNumber: true, vehicleType: true },
                },
              },
            },
          },
        },
      },
      orderBy: { receivedAt: "desc" },
    });

    return NextResponse.json(receipts);
  } catch (error: any) {
    console.error("GET Contract Receipts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
