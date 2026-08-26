import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LandStatus, SizeUnit } from "@prisma/client";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "LANDOWNER") {
      return NextResponse.json({ error: "Forbidden: Only landowners can access land list" }, { status: 403 });
    }

    const lands = await db.land.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(lands);
  } catch (error: any) {
    console.error("GET Lands Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "LANDOWNER") {
      return NextResponse.json({ error: "Forbidden: Only landowners can add land" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      size,
      unit,
      address,
      village,
      district,
      state,
      pincode,
      latitude,
      longitude,
      description,
    } = body;

    // Validation
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Land name is required." }, { status: 400 });
    }

    const parsedSize = parseFloat(size);
    if (isNaN(parsedSize) || parsedSize <= 0) {
      return NextResponse.json({ error: "Land size must be a positive number." }, { status: 400 });
    }

    if (unit !== "ACRE" && unit !== "HECTARE") {
      return NextResponse.json({ error: "Size unit must be ACRE or HECTARE." }, { status: 400 });
    }

    if (!address || !village || !district || !state) {
      return NextResponse.json({ error: "Address, Village, District, and State are required." }, { status: 400 });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json({ error: "Latitude must be a valid number between -90 and 90." }, { status: 400 });
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "Longitude must be a valid number between -180 and 180." }, { status: 400 });
    }

    const land = await db.land.create({
      data: {
        ownerId: user.id,
        name: name.trim(),
        size: parsedSize,
        unit: unit as SizeUnit,
        address: address.trim(),
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: pincode ? pincode.trim() : null,
        latitude: lat,
        longitude: lng,
        description: description ? description.trim() : null,
        status: LandStatus.AVAILABLE,
      },
    });

    return NextResponse.json({ success: true, land });
  } catch (error: any) {
    console.error("POST Land Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
