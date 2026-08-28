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

    if (user.role !== "BUYER") {
      return NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
    }

    const { id: demandId } = await params;
    const demand = await db.buyerDemand.findUnique({
      where: { id: demandId },
    });

    if (!demand) {
      return NextResponse.json({ error: "Demand profile not found" }, { status: 404 });
    }

    if (demand.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
    }

    const selections = await db.demandLandSelection.findMany({
      where: { demandId },
      include: {
        land: {
          include: {
            owner: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      selections.map((s) => ({
        id: s.land.id,
        name: s.land.name,
        size: s.land.size,
        unit: s.land.unit,
        village: s.land.village,
        district: s.land.district,
        state: s.land.state,
        latitude: s.land.latitude,
        longitude: s.land.longitude,
        status: s.land.status,
        ownerName: s.land.owner.name,
        selectionId: s.id,
      }))
    );
  } catch (error: any) {
    console.error("GET Selection Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
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

    const { id: demandId } = await params;
    const demand = await db.buyerDemand.findUnique({
      where: { id: demandId },
    });

    if (!demand) {
      return NextResponse.json({ error: "Demand profile not found" }, { status: 404 });
    }

    if (demand.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
    }

    const body = await request.json();
    const { landId } = body;

    if (!landId) {
      return NextResponse.json({ error: "Land ID is required." }, { status: 400 });
    }

    const land = await db.land.findUnique({
      where: { id: landId },
    });

    if (!land) {
      return NextResponse.json({ error: "Selected land parcel does not exist." }, { status: 404 });
    }

    if (land.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Selected land is not available." }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.demandLandSelection.findUnique({
      where: {
        demandId_landId: {
          demandId,
          landId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Land is already selected for this demand." }, { status: 400 });
    }

    const selection = await db.demandLandSelection.create({
      data: {
        demandId,
        landId,
      },
    });

    return NextResponse.json({ success: true, selection });
  } catch (error: any) {
    console.error("POST Selection Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const { id: demandId } = await params;
    const demand = await db.buyerDemand.findUnique({
      where: { id: demandId },
    });

    if (!demand) {
      return NextResponse.json({ error: "Demand profile not found" }, { status: 404 });
    }

    if (demand.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
    }

    const body = await request.json();
    const { landId } = body;

    if (!landId) {
      return NextResponse.json({ error: "Land ID is required." }, { status: 400 });
    }

    await db.demandLandSelection.delete({
      where: {
        demandId_landId: {
          demandId,
          landId,
        },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Selection Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
