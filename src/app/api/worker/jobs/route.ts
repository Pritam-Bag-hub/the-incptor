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

    // RBAC: Worker or Admin
    if (user.role !== "WORKER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Worker role required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const radiusKm = parseFloat(searchParams.get("radius") || "50");

    // Fetch worker location
    const worker = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, latitude: true, longitude: true },
    });

    const workerLat = worker?.latitude ?? 30.9650;
    const workerLng = worker?.longitude ?? 75.8900;

    // Fetch active worker contracts for this worker to check availability/overlap
    const existingWorkerContracts = await db.workerContract.findMany({
      where: {
        workerId: user.id,
        status: "ACTIVE",
      },
    });

    // Fetch all OPEN and FILLED job requirements
    const jobs = await db.workerJobRequirement.findMany({
      include: {
        crop: true,
        land: true,
        landowner: {
          select: { id: true, name: true, phone: true },
        },
        applications: {
          where: { workerId: user.id },
        },
        workerContracts: {
          where: { workerId: user.id },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const nearbyJobs = jobs
      .map((j) => {
        const landLat = j.land.latitude;
        const landLng = j.land.longitude;
        const distanceKm = calculateDistanceKm(workerLat, workerLng, landLat, landLng);

        // User application status for this job
        const app = j.applications[0];
        const userAppStatus = app ? app.status : null;
        const isAssignedToUser = j.workerContracts.length > 0;

        // Check overlapping contract availability
        const hasOverlappingContract = existingWorkerContracts.some(
          (wc) =>
            wc.jobRequirementId !== j.id &&
            wc.startDate <= j.endDate &&
            wc.endDate >= j.startDate
        );

        return {
          id: j.id,
          contractId: j.contractId,
          title: j.title,
          description: j.description,
          workersRequired: j.workersRequired,
          acceptedWorkers: j.acceptedWorkers,
          startDate: j.startDate,
          endDate: j.endDate,
          workingHours: j.workingHours,
          status: j.status, // OPEN, FILLED, CANCELLED
          crop: {
            id: j.crop.id,
            name: j.crop.name,
            durationDays: j.crop.durationDays,
          },
          land: {
            id: j.land.id,
            name: j.land.name,
            size: j.land.size,
            unit: j.land.unit,
            address: j.land.address,
            village: j.land.village,
            district: j.land.district,
            state: j.land.state,
            latitude: j.land.latitude,
            longitude: j.land.longitude,
          },
          landowner: j.landowner,
          distanceKm,
          userApplicationStatus: userAppStatus,
          isAssignedToUser,
          hasOverlappingContract,
        };
      })
      .filter((j) => {
        // Exclude if worker has overlapping contract and is not applied/assigned to this specific job
        if (j.hasOverlappingContract && !j.userApplicationStatus && !j.isAssignedToUser) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by distance first, then start date
        if (a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });

    return NextResponse.json(nearbyJobs);
  } catch (error: any) {
    console.error("GET Worker Jobs Discovery Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
