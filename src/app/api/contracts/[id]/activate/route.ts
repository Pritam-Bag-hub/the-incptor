import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateMilestonesForContract } from "@/lib/contractHelpers";
import { generateTasksForContract } from "@/lib/taskHelpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "BUYER") {
      return NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
    }

    const { id: contractId } = await params;
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        land: true,
        crop: true,
        demand: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract proposal not found." }, { status: 404 });
    }

    if (contract.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this contract." }, { status: 403 });
    }

    if (contract.status !== "ACCEPTED" && contract.status !== "PENDING_APPROVAL") {
      return NextResponse.json({ error: "Only pending or accepted contract proposals can be activated." }, { status: 400 });
    }

    const updated = await db.$transaction(async (tx) => {
      // 1. Update contract status
      const updatedContract = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: "ACTIVE",
          activatedAt: new Date(),
        },
      });

      // 2. Lock associated land parcel status to UNDER_CONTRACT if not already
      if (contract.land.status !== "UNDER_CONTRACT") {
        await tx.land.update({
          where: { id: contract.landId },
          data: { status: "UNDER_CONTRACT" },
        });
      }

      // 2. Initialize defaults for ContractFinancialAllocation (idempotent)
      const totalContractValue = contract.proposedPrice;
      const platformFee = totalContractValue * 0.10;
      const landownerAmount = totalContractValue * 0.50;
      const workforceBudget = totalContractValue * 0.25;
      const logisticsBudget = totalContractValue * 0.10;
      const reserveBudget = totalContractValue * 0.05;

      await tx.contractFinancialAllocation.upsert({
        where: { contractId },
        create: {
          contractId,
          totalContractValue,
          landownerAmount,
          workforceBudget,
          logisticsBudget,
          platformFee,
          reserveBudget,
          isConfigured: false,
          currency: "INR",
        },
        update: {
          totalContractValue,
        },
      });

      // 3. Initialize expected crop yield from metadata
      let estimatedQuantity: number | null = null;
      if (contract.crop.metadataJson) {
        try {
          const meta = JSON.parse(contract.crop.metadataJson);
          const yieldPerAcre = parseFloat(meta.expectedYieldPerAcre);
          if (!isNaN(yieldPerAcre) && yieldPerAcre > 0) {
            estimatedQuantity = yieldPerAcre * contract.landArea;
          }
        } catch (e) {
          console.error("Error parsing crop metadata for yield:", e);
        }
      }

      await tx.contractYield.upsert({
        where: { contractId },
        create: {
          contractId,
          estimatedQuantity,
          actualQuantity: null,
          unit: contract.demand.quantityUnit,
          fulfillmentPercentage: null,
          fulfillmentStatus: "PENDING",
        },
        update: {
          estimatedQuantity,
          unit: contract.demand.quantityUnit,
        },
      });

      // 4. Generate crop milestones (idempotent)
      await generateMilestonesForContract(contractId, tx);

      // 5. Generate crop tasks (idempotent)
      await generateTasksForContract(contractId, tx);

      return updatedContract;
    });

    return NextResponse.json({ success: true, contract: updated });
  } catch (error: any) {
    console.error("PATCH Activate Contract Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
