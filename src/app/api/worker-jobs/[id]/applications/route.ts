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
      include: { land: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job requirement not found." }, { status: 404 });
    }

    // RBAC: Landowner of job or Admin
    if (job.landownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Landowner access required." }, { status: 403 });
    }

    const applications = await db.workerJobApplication.findMany({
      where: { jobRequirementId: jobId },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    const mapped = applications.map((app) => {
      const wLat = app.worker.latitude ?? 30.9650;
      const wLng = app.worker.longitude ?? 75.8900;
      const distanceKm = calculateDistanceKm(wLat, wLng, job.land.latitude, job.land.longitude);

      return {
        id: app.id,
        jobRequirementId: app.jobRequirementId,
        workerId: app.workerId,
        status: app.status,
        appliedAt: app.appliedAt,
        distanceKm,
        worker: {
          id: app.worker.id,
          name: app.worker.name,
          phone: app.worker.phone,
        },
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("GET Applications Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
