import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildOptimizationInput } from "@/lib/optimizationHelpers";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict RBAC: Center Manager or Admin access required
    if (user.role !== "CENTER_MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Center Manager or Admin access required to access route optimization layer." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get("buyerId") || undefined;
    const demandId = searchParams.get("demandId") || undefined;
    const destinationAddress = searchParams.get("destinationAddress") || undefined;

    const rawLat = searchParams.get("destinationLatitude");
    const rawLng = searchParams.get("destinationLongitude");

    const destinationLatitude = rawLat !== null ? parseFloat(rawLat) : undefined;
    const destinationLongitude = rawLng !== null ? parseFloat(rawLng) : undefined;

    const optimizationInput = await buildOptimizationInput({
      buyerId,
      demandId,
      destinationAddress,
      destinationLatitude,
      destinationLongitude,
    });

    return NextResponse.json(optimizationInput);
  } catch (error: any) {
    console.error("GET Route Optimization Input Error:", error);
    const statusCode = error.message?.includes("Invalid destination coordinates") ? 400 : 500;
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: statusCode });
  }
}
