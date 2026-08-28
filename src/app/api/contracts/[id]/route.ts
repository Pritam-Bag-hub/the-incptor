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

    const { id: contractId } = await params;
    const contract = await db.contract.findUnique({
      where: { id: contractId },
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
        landowner: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        history: {
          orderBy: {
            revision: "asc"
          }
        },
        progressUpdates: {
          orderBy: {
            createdAt: "asc"
          }
        }
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    // Access check: User must be either the buyer or the landowner involved
    if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You are not authorized to view this contract." }, { status: 403 });
    }

    return NextResponse.json(contract);
  } catch (error: any) {
    console.error("GET Contract Details Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
