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

    const { id: shipmentId } = await params;

    const shipment = await db.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        buyer: { select: { id: true, name: true, phone: true, role: true } },
        demand: true,
        vehicle: true,
        transporter: { select: { id: true, name: true, phone: true, role: true } },
        items: {
          include: {
            harvestReceipt: {
              include: {
                contract: {
                  select: {
                    id: true,
                    buyerId: true,
                    landownerId: true,
                    landArea: true,
                    allocatedQuantity: true,
                    proposedPrice: true,
                    crop: { select: { id: true, name: true } },
                    landowner: { select: { id: true, name: true, phone: true } },
                  },
                },
              },
            },
            collectionCenter: true,
          },
          orderBy: { pickupSequence: "asc" },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
    }

    // Role Security Check
    const isBuyer = shipment.buyerId === user.id;
    const isTransporter = shipment.transporterId === user.id;
    const isCenterManager = user.role === "CENTER_MANAGER";
    const isAdmin = user.role === "ADMIN";
    const isInspector = user.role === "INSPECTOR";
    const isLandowner = shipment.items.some(
      (item) => item.harvestReceipt?.contract?.landownerId === user.id
    );

    if (!isBuyer && !isTransporter && !isCenterManager && !isAdmin && !isInspector && !isLandowner) {
      return NextResponse.json({ error: "Forbidden: Access denied to shipment." }, { status: 403 });
    }

    return NextResponse.json(shipment);
  } catch (error: any) {
    console.error("GET Shipment Detail Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
