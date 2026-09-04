import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateDistanceKm } from "@/lib/geoHelpers";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workerContract = await db.workerContract.findFirst({
      where: {
        workerId: user.id,
        status: "ACTIVE",
      },
      include: {
        land: true,
        crop: true,
        landowner: {
          select: { id: true, name: true, phone: true },
        },
        farmingContract: {
          select: {
            id: true,
            status: true,
            landArea: true,
            startDate: true,
            expectedHarvestDate: true,
          },
        },
        jobRequirement: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!workerContract) {
      return NextResponse.json({ activeAssignment: null });
    }

    const worker = await db.user.findUnique({
      where: { id: user.id },
      select: { latitude: true, longitude: true },
    });

    const wLat = worker?.latitude ?? 30.9650;
    const wLng = worker?.longitude ?? 75.8900;
    const distanceKm = calculateDistanceKm(wLat, wLng, workerContract.land.latitude, workerContract.land.longitude);

    return NextResponse.json({
      activeAssignment: {
        id: workerContract.id,
        farmingContractId: workerContract.farmingContractId,
        jobRequirementId: workerContract.jobRequirementId,
        startDate: workerContract.startDate,
        endDate: workerContract.endDate,
        workingHours: workerContract.workingHours,
        status: workerContract.status,
        distanceKm,
        land: workerContract.land,
        crop: workerContract.crop,
        landowner: workerContract.landowner,
        farmingContract: workerContract.farmingContract,
      },
    });
  } catch (error: any) {
    console.error("GET Worker Assignment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
