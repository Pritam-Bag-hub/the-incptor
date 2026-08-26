import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BuyerDemandStatus, QuantityUnit } from "@prisma/client";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "BUYER") {
      return NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
    }

    const demands = await db.buyerDemand.findMany({
      where: { buyerId: user.id },
      include: {
        crop: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(demands);
  } catch (error: any) {
    console.error("GET Demands Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "BUYER") {
      return NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      cropId,
      requiredQuantity,
      quantityUnit,
      preferredState,
      preferredDistrict,
      preferredLatitude,
      preferredLongitude,
      searchRadiusKm,
      requiredLandArea,
      preferredStartDate,
      expectedHarvestDate,
      notes,
    } = body;

    // Validations
    if (!cropId) {
      return NextResponse.json({ error: "Crop is required." }, { status: 400 });
    }

    const crop = await db.crop.findUnique({
      where: { id: cropId },
    });

    if (!crop) {
      return NextResponse.json({ error: "Selected crop does not exist." }, { status: 400 });
    }

    const parsedQty = parseFloat(requiredQuantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json({ error: "Required quantity must be a positive number." }, { status: 400 });
    }

    if (quantityUnit !== "KG" && quantityUnit !== "QUINTAL" && quantityUnit !== "TONNE") {
      return NextResponse.json({ error: "Invalid quantity unit." }, { status: 400 });
    }

    if (!preferredState || preferredState.trim() === "") {
      return NextResponse.json({ error: "Preferred state cannot be empty." }, { status: 400 });
    }

    let parsedLandArea = null;
    if (requiredLandArea !== undefined && requiredLandArea !== null && requiredLandArea !== "") {
      parsedLandArea = parseFloat(requiredLandArea);
      if (isNaN(parsedLandArea) || parsedLandArea <= 0) {
        return NextResponse.json({ error: "Required land area must be greater than 0." }, { status: 400 });
      }
    }

    let lat = null;
    if (preferredLatitude !== undefined && preferredLatitude !== null && preferredLatitude !== "") {
      lat = parseFloat(preferredLatitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json({ error: "Latitude must be between -90 and 90." }, { status: 400 });
      }
    }

    let lng = null;
    if (preferredLongitude !== undefined && preferredLongitude !== null && preferredLongitude !== "") {
      lng = parseFloat(preferredLongitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return NextResponse.json({ error: "Longitude must be between -180 and 180." }, { status: 400 });
      }
    }

    let radius = null;
    if (searchRadiusKm !== undefined && searchRadiusKm !== null && searchRadiusKm !== "") {
      radius = parseFloat(searchRadiusKm);
      if (isNaN(radius) || radius <= 0) {
        return NextResponse.json({ error: "Search radius must be greater than 0." }, { status: 400 });
      }
    }

    let start = null;
    if (preferredStartDate) {
      start = new Date(preferredStartDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json({ error: "Preferred start date is invalid." }, { status: 400 });
      }
    }

    let harvest = null;
    if (expectedHarvestDate) {
      harvest = new Date(expectedHarvestDate);
      if (isNaN(harvest.getTime())) {
        return NextResponse.json({ error: "Expected harvest date is invalid." }, { status: 400 });
      }
    }

    if (start && harvest && harvest < start) {
      return NextResponse.json({ error: "Expected harvest date cannot be before preferred start date." }, { status: 400 });
    }

    const demand = await db.buyerDemand.create({
      data: {
        buyerId: user.id,
        cropId,
        requiredQuantity: parsedQty,
        quantityUnit: quantityUnit as QuantityUnit,
        preferredState: preferredState.trim(),
        preferredDistrict: preferredDistrict ? preferredDistrict.trim() : null,
        preferredLatitude: lat,
        preferredLongitude: lng,
        searchRadiusKm: radius,
        requiredLandArea: parsedLandArea,
        preferredStartDate: start,
        expectedHarvestDate: harvest,
        notes: notes ? notes.trim() : null,
        status: BuyerDemandStatus.ACTIVE,
      },
    });

    return NextResponse.json({ success: true, demand });
  } catch (error: any) {
    console.error("POST Demand Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
