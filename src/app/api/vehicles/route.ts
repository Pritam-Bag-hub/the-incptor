import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { VehicleType, QuantityUnit } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let whereClause: any = {};

    if (user.role === "ADMIN") {
      // Admin gets all vehicles
      whereClause = {};
    } else if (user.role === "CENTER_MANAGER") {
      // Center Manager gets available IDLE vehicles
      whereClause = { isAvailable: true, status: "IDLE" };
    } else if (user.role === "TRANSPORTER") {
      // Transporter gets own vehicles
      whereClause = { transporterId: user.id };
    } else {
      return NextResponse.json({ error: "Forbidden: Access denied." }, { status: 403 });
    }

    const vehicles = await db.vehicle.findMany({
      where: whereClause,
      include: {
        transporter: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vehicles);
  } catch (error: any) {
    console.error("GET Vehicles Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin only
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      vehicleNumber,
      vehicleType: rawType,
      capacity: rawCapacity,
      capacityUnit: rawUnit,
      transporterId,
      currentLatitude,
      currentLongitude,
    } = body;

    if (!vehicleNumber || typeof vehicleNumber !== "string" || !vehicleNumber.trim()) {
      return NextResponse.json({ error: "Vehicle registration number is required." }, { status: 400 });
    }

    const capacity = parseFloat(rawCapacity);
    if (isNaN(capacity) || capacity <= 0) {
      return NextResponse.json({ error: "Capacity must be a positive number." }, { status: 400 });
    }

    if (!transporterId || typeof transporterId !== "string") {
      return NextResponse.json({ error: "transporterId is required." }, { status: 400 });
    }

    // Validate transporter user exists and has TRANSPORTER role
    const transporter = await db.user.findUnique({
      where: { id: transporterId },
    });

    if (!transporter) {
      return NextResponse.json({ error: "Transporter user not found." }, { status: 404 });
    }

    if (transporter.role !== "TRANSPORTER") {
      return NextResponse.json({ error: "Selected user must have TRANSPORTER role." }, { status: 400 });
    }

    // Check duplicate registration number
    const existingVehicle = await db.vehicle.findUnique({
      where: { vehicleNumber: vehicleNumber.trim() },
    });
    if (existingVehicle) {
      return NextResponse.json(
        { error: `Vehicle with registration number '${vehicleNumber.trim()}' already exists.` },
        { status: 400 }
      );
    }

    const validTypes: VehicleType[] = ["PICKUP_TRUCK", "MEDIUM_LORRY", "HEAVY_TRUCK", "REFRIGERATED_VAN"];
    const vehicleType: VehicleType = validTypes.includes(rawType) ? rawType : "MEDIUM_LORRY";

    const validUnits: QuantityUnit[] = ["KG", "QUINTAL", "TONNE"];
    const capacityUnit: QuantityUnit = validUnits.includes(rawUnit) ? rawUnit : "TONNE";

    const latNum = currentLatitude !== undefined && currentLatitude !== null ? parseFloat(currentLatitude) : null;
    const lngNum = currentLongitude !== undefined && currentLongitude !== null ? parseFloat(currentLongitude) : null;

    const newVehicle = await db.vehicle.create({
      data: {
        vehicleNumber: vehicleNumber.trim(),
        vehicleType,
        capacity,
        capacityUnit,
        transporterId,
        isAvailable: true,
        status: "IDLE",
        currentLatitude: latNum !== null && !isNaN(latNum) ? latNum : null,
        currentLongitude: lngNum !== null && !isNaN(lngNum) ? lngNum : null,
      },
      include: {
        transporter: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
    });

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error: any) {
    console.error("POST Vehicle Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
