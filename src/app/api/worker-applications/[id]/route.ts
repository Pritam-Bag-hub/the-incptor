import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await params;
    const body = await request.json().catch(() => ({}));
    const { action } = body; // "ACCEPT" or "REJECT"

    if (!action || (action !== "ACCEPT" && action !== "REJECT")) {
      return NextResponse.json(
        { error: "action ('ACCEPT' or 'REJECT') is required." },
        { status: 400 }
      );
    }

    const application = await db.workerJobApplication.findUnique({
      where: { id: applicationId },
      include: {
        jobRequirement: {
          include: {
            contract: true,
            land: true,
            crop: true,
          },
        },
        worker: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const job = application.jobRequirement;

    // RBAC: Landowner of job or Admin
    if (job.landownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the Landowner of this requirement can process applications." },
        { status: 403 }
      );
    }

    if (action === "REJECT") {
      const updatedApp = await db.workerJobApplication.update({
        where: { id: applicationId },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ success: true, application: updatedApp });
    }

    // ACTION: ACCEPT
    // Check if worker already accepted
    if (application.status === "ACCEPTED") {
      return NextResponse.json({ error: "Application is already accepted." }, { status: 400 });
    }

    // Capacity check
    if (job.status === "FILLED" || job.acceptedWorkers >= job.workersRequired) {
      return NextResponse.json(
        { error: "Position Filled: Job requirement capacity has already been reached." },
        { status: 400 }
      );
    }

    // Check if worker already has an active WorkerContract for this job requirement
    const existingContract = await db.workerContract.findFirst({
      where: {
        workerId: application.workerId,
        jobRequirementId: job.id,
        status: "ACTIVE",
      },
    });

    if (existingContract) {
      return NextResponse.json(
        { error: "Worker is already assigned to this job requirement." },
        { status: 400 }
      );
    }

    // Update application to ACCEPTED
    const updatedApp = await db.workerJobApplication.update({
      where: { id: applicationId },
      data: { status: "ACCEPTED" },
    });

    // Increment acceptedWorkers
    const newAcceptedCount = job.acceptedWorkers + 1;
    const isNowFilled = newAcceptedCount >= job.workersRequired;

    await db.workerJobRequirement.update({
      where: { id: job.id },
      data: {
        acceptedWorkers: newAcceptedCount,
        status: isNowFilled ? "FILLED" : job.status,
      },
    });

    // Create WorkerContract (separate employment assignment)
    const workerContract = await db.workerContract.create({
      data: {
        workerId: application.workerId,
        landownerId: job.landownerId,
        farmingContractId: job.contractId,
        jobRequirementId: job.id,
        landId: job.landId,
        cropId: job.cropId,
        startDate: job.startDate,
        endDate: job.endDate,
        workingHours: job.workingHours,
        status: "ACTIVE",
      },
      include: {
        worker: { select: { id: true, name: true, phone: true } },
        landowner: { select: { id: true, name: true, phone: true } },
        land: true,
        crop: true,
      },
    });

    // Backfill tasks if none exist on farming contract so worker can start daily work
    if (job.contractId) {
      const dbTasks = await db.contractTask.findMany({ where: { contractId: job.contractId } });
      if (dbTasks.length === 0) {
        // Import task helper dynamically or invoke task generation
        const { backfillContractTasks } = await import("../../../../lib/taskHelpers");
        await backfillContractTasks(job.contractId);
      }
    }

    return NextResponse.json({
      success: true,
      application: updatedApp,
      workerContract,
      jobStatus: isNowFilled ? "FILLED" : "OPEN",
    });
  } catch (error: any) {
    console.error("PATCH Application Action Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
