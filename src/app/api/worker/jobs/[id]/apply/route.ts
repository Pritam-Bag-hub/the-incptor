import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Worker or Admin
    if (user.role !== "WORKER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Worker role required to apply for jobs." }, { status: 403 });
    }

    const { id: jobId } = await params;

    const job = await db.workerJobRequirement.findUnique({
      where: { id: jobId },
      include: {
        crop: true,
        land: true,
        landowner: { select: { id: true, name: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Farming job requirement not found." }, { status: 404 });
    }

    // Capacity check
    if (job.status === "FILLED" || job.acceptedWorkers >= job.workersRequired) {
      return NextResponse.json(
        { error: "Position Filled: This job requirement has reached maximum worker capacity." },
        { status: 400 }
      );
    }

    // Check duplicate application
    const existingApp = await db.workerJobApplication.findUnique({
      where: {
        workerId_jobRequirementId: {
          workerId: user.id,
          jobRequirementId: jobId,
        },
      },
    });

    if (existingApp) {
      return NextResponse.json(
        { error: `You have already applied for this job (Status: ${existingApp.status}).` },
        { status: 400 }
      );
    }

    // Check if worker is landowner of this contract (worker cannot apply to own job)
    if (job.landownerId === user.id) {
      return NextResponse.json(
        { error: "Landowner cannot apply to their own job requirement." },
        { status: 400 }
      );
    }

    // Create application (Status: APPLIED)
    const application = await db.workerJobApplication.create({
      data: {
        jobRequirementId: jobId,
        workerId: user.id,
        status: "APPLIED",
      },
      include: {
        jobRequirement: {
          include: {
            crop: true,
            land: true,
            landowner: { select: { id: true, name: true, phone: true } },
          },
        },
        worker: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error: any) {
    console.error("POST Worker Job Application Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
