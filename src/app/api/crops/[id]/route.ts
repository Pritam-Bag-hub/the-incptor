import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const crop = await db.crop.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!crop) {
      return NextResponse.json({ error: "Crop not found" }, { status: 404 });
    }

    return NextResponse.json(crop);
  } catch (error: any) {
    console.error("GET Crop Detail Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
