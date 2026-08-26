import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LandStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "LANDOWNER") {
      return NextResponse.json({ error: "Forbidden: Landowner access only" }, { status: 403 });
    }

    const { id } = await params;
    const land = await db.land.findUnique({
      where: { id },
    });

    if (!land) {
      return NextResponse.json({ error: "Land not found" }, { status: 404 });
    }

    // Security check: Must own the land
    if (land.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this land" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (status !== "AVAILABLE" && status !== "UNAVAILABLE") {
      return NextResponse.json({ error: "Status must be AVAILABLE or UNAVAILABLE." }, { status: 400 });
    }

    // Restriction: Cannot manually toggle status when under contract
    if (land.status === "UNDER_CONTRACT") {
      return NextResponse.json({ error: "Cannot change availability status of land currently UNDER_CONTRACT." }, { status: 400 });
    }

    const updatedLand = await db.land.update({
      where: { id },
      data: {
        status: status as LandStatus,
      },
    });

    return NextResponse.json({ success: true, status: updatedLand.status });
  } catch (error: any) {
    console.error("PATCH Land Status Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
