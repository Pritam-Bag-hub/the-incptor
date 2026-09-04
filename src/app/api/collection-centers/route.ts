import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const whereClause: any = {};
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const centers = await db.collectionCenter.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        village: true,
        district: true,
        state: true,
        pincode: true,
        latitude: true,
        longitude: true,
        capacityTonnes: true,
        isActive: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(centers);
  } catch (error: any) {
    console.error("GET Collection Centers Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization: Admin only
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      name,
      code,
      address,
      village,
      district,
      state,
      pincode,
      latitude,
      longitude,
      capacityTonnes,
      managerId,
    } = body;

    // Validations
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Collection center name is required." }, { status: 400 });
    }
    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Collection center code is required." }, { status: 400 });
    }
    if (!address || typeof address !== "string" || !address.trim()) {
      return NextResponse.json({ error: "Address is required." }, { status: 400 });
    }
    if (!village || typeof village !== "string" || !village.trim()) {
      return NextResponse.json({ error: "Village is required." }, { status: 400 });
    }
    if (!district || typeof district !== "string" || !district.trim()) {
      return NextResponse.json({ error: "District is required." }, { status: 400 });
    }
    if (!state || typeof state !== "string" || !state.trim()) {
      return NextResponse.json({ error: "State is required." }, { status: 400 });
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    const capNum = parseFloat(capacityTonnes);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return NextResponse.json({ error: "Latitude must be a valid number between -90 and 90." }, { status: 400 });
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return NextResponse.json({ error: "Longitude must be a valid number between -180 and 180." }, { status: 400 });
    }
    if (isNaN(capNum) || capNum <= 0) {
      return NextResponse.json({ error: "Capacity in tonnes must be a positive number." }, { status: 400 });
    }

    // Check duplicate code
    const existingCode = await db.collectionCenter.findUnique({
      where: { code: code.trim() },
    });
    if (existingCode) {
      return NextResponse.json({ error: `Collection center code '${code.trim()}' already exists.` }, { status: 400 });
    }

    const newCenter = await db.collectionCenter.create({
      data: {
        name: name.trim(),
        code: code.trim(),
        address: address.trim(),
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: pincode ? pincode.trim() : null,
        latitude: latNum,
        longitude: lngNum,
        capacityTonnes: capNum,
        managerId: managerId || null,
        isActive: true,
      },
    });

    return NextResponse.json(newCenter, { status: 201 });
  } catch (error: any) {
    console.error("POST Collection Center Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
