import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { solveRouteOptimization } from "@/lib/routeOptimization";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict RBAC: Center Manager or Admin access required
    if (user.role !== "CENTER_MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Center Manager or Admin access required to execute route optimization solver." },
        { status: 403 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty or non-JSON body fallback
    }

    const { searchParams } = new URL(request.url);

    const buyerId = body.buyerId || searchParams.get("buyerId") || undefined;
    const demandId = body.demandId || searchParams.get("demandId") || undefined;
    const commodityId = body.commodityId || searchParams.get("commodityId") || undefined;
    const destinationAddress = body.destinationAddress || searchParams.get("destinationAddress") || undefined;

    const rawDemand = body.demandKg ?? searchParams.get("demandKg");
    const demandKg = rawDemand !== undefined && rawDemand !== null ? parseFloat(rawDemand) : undefined;

    const rawLat = body.destinationLatitude ?? searchParams.get("destinationLatitude");
    const rawLng = body.destinationLongitude ?? searchParams.get("destinationLongitude");

    const destinationLatitude = rawLat !== undefined && rawLat !== null ? parseFloat(rawLat) : undefined;
    const destinationLongitude = rawLng !== undefined && rawLng !== null ? parseFloat(rawLng) : undefined;

    const config = body.config || undefined;

    const result = await solveRouteOptimization({
      buyerId,
      demandId,
      commodityId,
      demandKg,
      destinationAddress,
      destinationLatitude,
      destinationLongitude,
      config,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST Route Optimization Solve Error:", error);
    const isBadCoord = error.message?.includes("DESTINATION_COORDINATES_UNRESOLVED");
    const isMultiCommodity = error.message?.includes("MULTIPLE_COMMODITIES_PRESENT");
    const statusCode = isBadCoord || isMultiCommodity ? 400 : 500;

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: statusCode }
    );
  }
}
