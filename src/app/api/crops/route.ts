import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category");

    const whereClause: any = {};
    if (categoryParam) {
      whereClause.OR = [
        { categoryId: categoryParam },
        { category: { name: categoryParam } },
      ];
    }

    const crops = await db.crop.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(crops);
  } catch (error: any) {
    console.error("GET Crops Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
