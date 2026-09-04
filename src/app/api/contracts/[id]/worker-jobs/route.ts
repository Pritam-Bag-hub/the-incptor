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

    const { id } = await params;

    const contract = await db.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    const jobs = await db.workerJobRequirement.findMany({
      where: { contractId: id },
      include: {
        crop: true,
        land: true,
        landowner: {
          select: { id: true, name: true, phone: true },
        },
        applications: {
          include: {
            worker: {
              select: { id: true, name: true, phone: true, latitude: true, longitude: true },
            },
          },
          orderBy: { appliedAt: "desc" },
        },
        workerContracts: {
          include: {
            worker: {
              select: { id: true, name: true, phone: true },
            },
            dailyReports: {
              orderBy: { date: "desc" },
              take: 5,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error("GET Worker Jobs Error:", error);
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

    const { id } = await params;

    const contract = await db.contract.findUnique({
      where: { id },
      include: { crop: true, land: true, landowner: true },
    });

    if (!contract) {
      return NextResponse.json({ error: "Farming contract not found." }, { status: 404 });
    }

    // RBAC: Landowner of contract or Admin
    if (contract.landownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the Landowner of this contract can post worker requirements." },
        { status: 403 }
      );
    }

    // Must be ACTIVE contract
    if (contract.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Worker requirements can only be created for ACTIVE farming contracts." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      workersRequired: rawReq,
      startDate: rawStart,
      endDate: rawEnd,
      workingHours,
      title,
      description,
    } = body;

    const workersRequired = parseInt(rawReq) || 1;
    if (workersRequired <= 0) {
      return NextResponse.json({ error: "workersRequired must be a positive integer." }, { status: 400 });
    }

    const startDate = rawStart ? new Date(rawStart) : new Date(contract.startDate);
    const endDate = rawEnd ? new Date(rawEnd) : new Date(contract.expectedHarvestDate);

    const jobTitle = title || `${contract.crop.name} Field Operations & Cultivation`;

    const newJob = await db.workerJobRequirement.create({
      data: {
        contractId: contract.id,
        landownerId: contract.landownerId,
        landId: contract.landId,
        cropId: contract.cropId,
        title: jobTitle,
        description: description || `Field maintenance and cultivation work for ${contract.crop.name} on ${contract.land.name}.`,
        workersRequired,
        acceptedWorkers: 0,
        startDate,
        endDate,
        workingHours: workingHours || "08:00 AM – 04:00 PM",
        status: "OPEN",
      },
      include: {
        crop: true,
        land: true,
        landowner: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (error: any) {
    console.error("POST Worker Job Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
