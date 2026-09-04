import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict RBAC: CENTER_MANAGER or ADMIN only
    if (user.role !== "CENTER_MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Center Manager or Admin access required." },
        { status: 403 }
      );
    }

    // Query active or completed contracts where actual harvest yield has been recorded by farmer
    const harvestedContracts = await db.contract.findMany({
      where: {
        status: { in: ["ACTIVE", "COMPLETED"] },
        yield: {
          actualQuantity: { not: null, gt: 0 },
        },
      },
      include: {
        land: true,
        crop: true,
        landowner: { select: { id: true, name: true, phone: true } },
        buyer: { select: { id: true, name: true, phone: true } },
        yield: true,
        harvestReceipts: {
          where: {
            status: { not: "REJECTED" },
          },
          include: {
            center: true,
          },
          orderBy: { receivedAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(harvestedContracts);
  } catch (error: any) {
    console.error("GET Pending Harvests Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
