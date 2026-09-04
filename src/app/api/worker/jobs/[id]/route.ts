import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateDistanceKm } from "@/lib/geoHelpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;

    const job = await db.workerJobRequirement.findUnique({
      where: { id: jobId },
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
    });

    if (!job) {
      return NextResponse.json({ error: "Job requirement not found." }, { status: 404 });
    }

    const worker = await db.user.findUnique({
      where: { id: user.id },
      select: { latitude: true, longitude: true },
    });

    const workerLat = worker?.latitude ?? 30.9650;
    const workerLng = worker?.longitude ?? 75.8900;
    const distanceKm = calculateDistanceKm(workerLat, workerLng, job.land.latitude, job.land.longitude);

    const userApp = job.applications[0];
    const userApplicationStatus = userApp ? userApp.status : null;
    const isAssignedToUser = job.workerContracts.length > 0;

    return NextResponse.json({
      id: job.id,
      contractId: job.contractId,
      title: job.title,
      description: job.description,
      workersRequired: job.workersRequired,
      acceptedWorkers: job.acceptedWorkers,
      startDate: job.startDate,
      endDate: job.endDate,
      workingHours: job.workingHours,
      status: job.status,
      crop: job.crop,
      land: job.land,
      landowner: job.landowner,
      distanceKm,
      userApplicationStatus,
      isAssignedToUser,
    });
  } catch (error: any) {
    console.error("GET Job Details Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
