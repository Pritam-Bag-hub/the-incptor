import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "LANDOWNER") {
      return NextResponse.json({ error: "Forbidden: Landowner role required" }, { status: 403 });
    }

    const contracts = await db.contract.findMany({
      where: {
        landownerId: user.id,
      },
      include: {
        land: true,
        crop: {
          include: {
            category: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        demand: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error("GET Landowner Contracts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
