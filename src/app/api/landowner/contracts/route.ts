import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "LANDOWNER") {
      return NextResponse.json({ error: "Forbidden: Landowner role required" }, { status: 403 });
    }

    const contracts = await db.contract.findMany({
      where: {
        landownerId: user.id,
      },
      include: {
        land: true,
        crop: {
          include: {
            category: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        demand: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error("GET Landowner Contracts Error:", error);
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
      return NextResponse.json({ error: "Forbidden: Landowner role required" }, { status: 403 });
    }

    const { demandId, landId } = await request.json();
    if (!demandId || !landId) {
      return NextResponse.json({ error: "demandId and landId are required." }, { status: 400 });
    }

    // 1. Verify land ownership
    const land = await db.land.findUnique({
      where: { id: landId },
    });

    if (!land || land.ownerId !== user.id) {
      return NextResponse.json({ error: "Land parcel not found or you do not own it." }, { status: 404 });
    }

    // 2. Verify demand existence
    const demand = await db.buyerDemand.findUnique({
      where: { id: demandId },
      include: { crop: true, buyer: true },
    });

    if (!demand) {
      return NextResponse.json({ error: "Buyer demand not found." }, { status: 404 });
    }

    // 3. Register DemandLandSelection
    await db.demandLandSelection.upsert({
      where: {
        demandId_landId: { demandId, landId },
      },
      create: { demandId, landId },
      update: {},
    });

    // 4. Calculate quantity and dates
    let allocatedQuantity = demand.requiredQuantity || land.size * 10;
    if (demand.crop?.metadataJson) {
      try {
        const meta = JSON.parse(demand.crop.metadataJson);
        const yieldPerAcre = parseFloat(meta.expectedYieldPerAcre);
        if (!isNaN(yieldPerAcre) && yieldPerAcre > 0) {
          allocatedQuantity = yieldPerAcre * land.size;
        }
      } catch (e) {}
    }

    const startDate = demand.preferredStartDate || new Date();
    const expectedHarvestDate = demand.expectedHarvestDate || new Date(Date.now() + (demand.crop.durationDays || 90) * 24 * 60 * 60 * 1000);
    const proposedPrice = 50000;

    // 5. Create or update contract proposal in PENDING_APPROVAL status
    const contract = await db.contract.upsert({
      where: {
        demandId_landId: { demandId, landId },
      },
      create: {
        demandId,
        landId,
        buyerId: demand.buyerId,
        landownerId: user.id,
        cropId: demand.cropId,
        landArea: land.size,
        allocatedQuantity,
        proposedPrice,
        startDate,
        expectedHarvestDate,
        status: "PENDING_APPROVAL",
        notes: `Farmer-initiated cultivation agreement proposal for land '${land.name}' and crop '${demand.crop.name}'.`,
      },
      update: {
        status: "PENDING_APPROVAL",
        notes: `Farmer-initiated cultivation agreement proposal for land '${land.name}' and crop '${demand.crop.name}'.`,
      },
    });

    return NextResponse.json({ success: true, contract });
  } catch (error: any) {
    console.error("POST Landowner Contract Proposal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
