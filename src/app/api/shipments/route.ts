import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let whereClause: any = {};

    if (user.role === "ADMIN") {
      whereClause = {};
    } else if (user.role === "BUYER") {
      whereClause = { buyerId: user.id };
    } else if (user.role === "TRANSPORTER") {
      whereClause = { transporterId: user.id };
    } else if (user.role === "CENTER_MANAGER") {
      whereClause = {
        OR: [
          { status: "DRAFT" },
          { items: { some: { collectionCenter: { managerId: user.id } } } },
        ],
      };
    } else if (user.role === "LANDOWNER") {
      whereClause = {
        items: {
          some: {
            harvestReceipt: {
              contract: { landownerId: user.id },
            },
          },
        },
      };
    } else if (user.role === "INSPECTOR") {
      whereClause = {};
    }

    const shipments = await db.shipment.findMany({
      where: whereClause,
      include: {
        buyer: { select: { id: true, name: true, phone: true, role: true } },
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
                    crop: { select: { id: true, name: true } },
                  },
                },
              },
            },
            collectionCenter: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(shipments);
  } catch (error: any) {
    console.error("GET Shipments Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorized: CENTER_MANAGER or ADMIN only (NOT BUYER)
    if (user.role !== "CENTER_MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Center Manager or Admin access required to create shipments." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      buyerId,
      destinationAddress,
      destinationLatitude: rawLat,
      destinationLongitude: rawLng,
      demandId,
      scheduledPickupDate,
    } = body;

    if (!buyerId || typeof buyerId !== "string") {
      return NextResponse.json({ error: "buyerId is required." }, { status: 400 });
    }

    const buyer = await db.user.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Target buyer user not found." }, { status: 404 });
    }

    if (buyer.role !== "BUYER") {
      return NextResponse.json({ error: "Selected user must have BUYER role." }, { status: 400 });
    }

    if (!destinationAddress || typeof destinationAddress !== "string" || !destinationAddress.trim()) {
      return NextResponse.json({ error: "Destination address is required." }, { status: 400 });
    }

    const destLat = parseFloat(rawLat);
    const destLng = parseFloat(rawLng);

    if (isNaN(destLat) || destLat < -90 || destLat > 90) {
      return NextResponse.json(
        { error: "Destination latitude must be a valid number between -90 and 90." },
        { status: 400 }
      );
    }

    if (isNaN(destLng) || destLng < -180 || destLng > 180) {
      return NextResponse.json(
        { error: "Destination longitude must be a valid number between -180 and 180." },
        { status: 400 }
      );
    }

    // Generate collision-safe shipment code
    const count = await db.shipment.count();
    const sequenceNum = (count + 1).toString().padStart(5, "0");
    const year = new Date().getFullYear();
    const shipmentCode = `SHP-${year}-${sequenceNum}`;

    const newShipment = await db.shipment.create({
      data: {
        shipmentCode,
        buyerId,
        demandId: demandId || null,
        status: "DRAFT",
        totalWeight: 0,
        weightUnit: "TONNE",
        destinationAddress: destinationAddress.trim(),
        destinationLatitude: destLat,
        destinationLongitude: destLng,
        scheduledPickupDate: scheduledPickupDate ? new Date(scheduledPickupDate) : null,
      },
      include: {
        buyer: { select: { id: true, name: true, phone: true, role: true } },
        items: true,
      },
    });

    return NextResponse.json(newShipment, { status: 201 });
  } catch (error: any) {
    console.error("POST Shipment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
