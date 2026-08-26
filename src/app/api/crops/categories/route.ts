import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.cropCategory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET Categories Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
