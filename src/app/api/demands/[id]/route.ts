import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuantityUnit } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "BUYER") {
      return NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
    }

    const { id } = await params;
    const demand = await db.buyerDemand.findUnique({
      where: { id },
      include: {
        crop: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!demand) {
      return NextResponse.json({ error: "Demand not found" }, { status: 404 });
    }

    if (demand.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
    }

    return NextResponse.json(demand);
  } catch (error: any) {
    console.error("GET Demand Detail Error:", error);
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

    if (user.role !== "BUYER") {
      return NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
    }

    const { id } = await params;
    const demand = await db.buyerDemand.findUnique({
      where: { id },
    });

    if (!demand) {
      return NextResponse.json({ error: "Demand not found" }, { status: 404 });
    }

    if (demand.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
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

    const updateData: any = {};

    if (cropId !== undefined) {
      const crop = await db.crop.findUnique({ where: { id: cropId } });
      if (!crop) {
        return NextResponse.json({ error: "Selected crop does not exist." }, { status: 400 });
      }
      updateData.cropId = cropId;
    }

    if (requiredQuantity !== undefined) {
      const parsedQty = parseFloat(requiredQuantity);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        return NextResponse.json({ error: "Required quantity must be a positive number." }, { status: 400 });
      }
      updateData.requiredQuantity = parsedQty;
    }

    if (quantityUnit !== undefined) {
      if (quantityUnit !== "KG" && quantityUnit !== "QUINTAL" && quantityUnit !== "TONNE") {
        return NextResponse.json({ error: "Invalid quantity unit." }, { status: 400 });
      }
      updateData.quantityUnit = quantityUnit as QuantityUnit;
    }

    if (preferredState !== undefined) {
      if (!preferredState || preferredState.trim() === "") {
        return NextResponse.json({ error: "Preferred state cannot be empty." }, { status: 400 });
      }
      updateData.preferredState = preferredState.trim();
    }

    if (preferredDistrict !== undefined) {
      updateData.preferredDistrict = preferredDistrict ? preferredDistrict.trim() : null;
    }

    if (preferredLatitude !== undefined) {
      if (preferredLatitude === null || preferredLatitude === "") {
        updateData.preferredLatitude = null;
      } else {
        const lat = parseFloat(preferredLatitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          return NextResponse.json({ error: "Latitude must be between -90 and 90." }, { status: 400 });
        }
        updateData.preferredLatitude = lat;
      }
    }

    if (preferredLongitude !== undefined) {
      if (preferredLongitude === null || preferredLongitude === "") {
        updateData.preferredLongitude = null;
      } else {
        const lng = parseFloat(preferredLongitude);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          return NextResponse.json({ error: "Longitude must be between -180 and 180." }, { status: 400 });
        }
        updateData.preferredLongitude = lng;
      }
    }

    if (searchRadiusKm !== undefined) {
      if (searchRadiusKm === null || searchRadiusKm === "") {
        updateData.searchRadiusKm = null;
      } else {
        const radius = parseFloat(searchRadiusKm);
        if (isNaN(radius) || radius <= 0) {
          return NextResponse.json({ error: "Search radius must be greater than 0." }, { status: 400 });
        }
        updateData.searchRadiusKm = radius;
      }
    }

    if (requiredLandArea !== undefined) {
      if (requiredLandArea === null || requiredLandArea === "") {
        updateData.requiredLandArea = null;
      } else {
        const parsedLandArea = parseFloat(requiredLandArea);
        if (isNaN(parsedLandArea) || parsedLandArea <= 0) {
          return NextResponse.json({ error: "Required land area must be greater than 0." }, { status: 400 });
        }
        updateData.requiredLandArea = parsedLandArea;
      }
    }

    let start = demand.preferredStartDate;
    if (preferredStartDate !== undefined) {
      if (preferredStartDate === null || preferredStartDate === "") {
        updateData.preferredStartDate = null;
        start = null;
      } else {
        const parsedStart = new Date(preferredStartDate);
        if (isNaN(parsedStart.getTime())) {
          return NextResponse.json({ error: "Preferred start date is invalid." }, { status: 400 });
        }
        updateData.preferredStartDate = parsedStart;
        start = parsedStart;
      }
    }

    let harvest = demand.expectedHarvestDate;
    if (expectedHarvestDate !== undefined) {
      if (expectedHarvestDate === null || expectedHarvestDate === "") {
        updateData.expectedHarvestDate = null;
        harvest = null;
      } else {
        const parsedHarvest = new Date(expectedHarvestDate);
        if (isNaN(parsedHarvest.getTime())) {
          return NextResponse.json({ error: "Expected harvest date is invalid." }, { status: 400 });
        }
        updateData.expectedHarvestDate = parsedHarvest;
        harvest = parsedHarvest;
      }
    }

    if (start && harvest && harvest < start) {
      return NextResponse.json({ error: "Expected harvest date cannot be before preferred start date." }, { status: 400 });
    }

    if (notes !== undefined) {
      updateData.notes = notes ? notes.trim() : null;
    }

    const updatedDemand = await db.buyerDemand.update({
      where: { id },
      data: updateData,
      include: {
        crop: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, demand: updatedDemand });
  } catch (error: any) {
    console.error("PATCH Demand Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
