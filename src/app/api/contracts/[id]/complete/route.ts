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

    const { id: contractId } = await params;

    const result = await db.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
        include: { land: true },
      });

      if (!contract) {
        throw new Error("Contract not found.");
      }

      // Check authorization: must be buyer or landowner
      if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
        throw new Error("Forbidden: You are not authorized to access this contract.");
      }

      if (contract.status === "COMPLETED") {
        throw new Error("Contract is already completed.");
      }

      if (contract.status !== "ACTIVE") {
        throw new Error("Only active contracts can be completed.");
      }

      // Update contract to COMPLETED
      const updatedContract = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Release land status to AVAILABLE
      await tx.land.update({
        where: { id: contract.landId },
        data: {
          status: "AVAILABLE",
        },
      });

      return updatedContract;
    });

    return NextResponse.json({ success: true, contract: result });
  } catch (error: any) {
    console.error("PATCH Complete Contract Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message?.includes("Forbidden") ? 403 : 400 }
    );
  }
}
