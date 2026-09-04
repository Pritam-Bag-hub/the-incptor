import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

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
    const { demandId, landId, proposedPrice, startDate, expectedHarvestDate, notes } = body;

    // 1. Basic validation
    if (!demandId || !landId || proposedPrice === undefined || !startDate || !expectedHarvestDate) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "Proposed price must be a positive number." }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(expectedHarvestDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ error: "Invalid timeline dates specified." }, { status: 400 });
    }

    // 2. Verify demand ownership
    const demand = await db.buyerDemand.findUnique({
      where: { id: demandId },
    });

    if (!demand) {
      return NextResponse.json({ error: "Demand profile not found." }, { status: 404 });
    }

    if (demand.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this demand." }, { status: 403 });
    }

    // 3. Verify land status
    const land = await db.land.findUnique({
      where: { id: landId },
    });

    if (!land) {
      return NextResponse.json({ error: "Land parcel not found." }, { status: 404 });
    }

    if (land.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Land is not available for proposals." }, { status: 409 });
    }

    // 4. Verify selection exists
    const selection = await db.demandLandSelection.findUnique({
      where: {
        demandId_landId: {
          demandId,
          landId,
        },
      },
    });

    if (!selection) {
      return NextResponse.json({ error: "You must select this land first before proposing a contract." }, { status: 400 });
    }

    // 5. Check if contract already exists for this (demandId + landId)
    const existingContract = await db.contract.findUnique({
      where: {
        demandId_landId: {
          demandId,
          landId,
        },
      },
    });

    // 6. Calculate allocatedQuantity using crop expected yield from metadata
    let allocatedQuantity = land.size; // Default fallback
    const crop = await db.crop.findUnique({
      where: { id: demand.cropId },
    });

    if (crop?.metadataJson) {
      try {
        const meta = JSON.parse(crop.metadataJson);
        const yieldPerAcre = parseFloat(meta.expectedYieldPerAcre);
        if (!isNaN(yieldPerAcre) && yieldPerAcre > 0) {
          allocatedQuantity = yieldPerAcre * land.size;
        }
      } catch (e) {
        console.error("Error parsing crop metadata yield:", e);
      }
    }

    if (existingContract) {
      if (existingContract.status !== "REJECTED" && existingContract.status !== "CANCELLED") {
        return NextResponse.json({ error: "A contract proposal already exists for this selected land." }, { status: 409 });
      }

      // Check ownership
      if (existingContract.buyerId !== user.id) {
        return NextResponse.json({ error: "Forbidden: You do not own the existing contract." }, { status: 403 });
      }

      // Inplace revision: copy current state into ContractHistory and update Contract
      const updatedContract = await db.$transaction(async (tx) => {
        // Create history log entry
        await tx.contractHistory.create({
          data: {
            contractId: existingContract.id,
            revision: existingContract.revision,
            landArea: existingContract.landArea,
            allocatedQuantity: existingContract.allocatedQuantity,
            proposedPrice: existingContract.proposedPrice,
            startDate: existingContract.startDate,
            expectedHarvestDate: existingContract.expectedHarvestDate,
            status: existingContract.status,
            notes: existingContract.notes,
            rejectionReason: existingContract.rejectionReason,
            decisionDate: existingContract.decisionDate,
            activatedAt: existingContract.activatedAt,
            completedAt: existingContract.completedAt,
          },
        });

        // Update contract with new values
        const updated = await tx.contract.update({
          where: { id: existingContract.id },
          data: {
            revision: existingContract.revision + 1,
            landArea: land.size,
            allocatedQuantity,
            proposedPrice: price,
            startDate: start,
            expectedHarvestDate: end,
            status: "PENDING_APPROVAL",
            notes: notes || null,
            rejectionReason: null,
            decisionDate: null,
            activatedAt: null,
            completedAt: null,
          },
        });

        return updated;
      });

      return NextResponse.json({ success: true, contract: updatedContract });
    }

    // 7. Create contract
    const contract = await db.contract.create({
      data: {
        demandId,
        landId,
        buyerId: user.id,
        landownerId: land.ownerId,
        cropId: demand.cropId,
        landArea: land.size,
        allocatedQuantity,
        proposedPrice: price,
        startDate: start,
        expectedHarvestDate: end,
        status: "PENDING_APPROVAL",
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, contract });
  } catch (error: any) {
    console.error("POST Contract Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const demandId = searchParams.get("demandId");

    const queryConditions: any = {};

    if (user.role === "BUYER") {
      queryConditions.buyerId = user.id;
      if (demandId) {
        queryConditions.demandId = demandId;
      }
    } else if (user.role === "WORKER" || user.role === "ADMIN") {
      queryConditions.status = "ACTIVE";
    } else if (user.role === "LANDOWNER") {
      queryConditions.landownerId = user.id;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contracts = await db.contract.findMany({
      where: queryConditions,
      include: {
        land: true,
        crop: {
          include: {
            category: true,
          },
        },
        landowner: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error("GET Contracts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
