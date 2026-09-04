import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { backfillFinancialAllocation, backfillContractYield } from "@/lib/contractHelpers";
import { calculateContractMonitoringState } from "@/lib/contractMonitoring";

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

    let contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        financialAllocation: true,
        yield: true,
        progressUpdates: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    // Access check: User must be buyer or landowner
    if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: Unauthorized access." }, { status: 403 });
    }

    // Safely backfill missing records for existing contracts
    let didBackfill = false;
    if (!contract.financialAllocation && (contract.status === "ACCEPTED" || contract.status === "ACTIVE" || contract.status === "COMPLETED")) {
      await backfillFinancialAllocation(contractId);
      didBackfill = true;
    }
    if (!contract.yield && (contract.status === "ACTIVE" || contract.status === "COMPLETED")) {
      await backfillContractYield(contractId);
      didBackfill = true;
    }

    // Re-fetch contract if we did backfill to ensure dynamic parameters are computed on actual db values
    if (didBackfill) {
      contract = await db.contract.findUnique({
        where: { id: contractId },
        include: {
          financialAllocation: true,
          yield: true,
          progressUpdates: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!contract) {
        return NextResponse.json({ error: "Contract not found after backfill." }, { status: 500 });
      }
    }

    // Calculations
    const latestProgress = contract.progressUpdates[0] || null;
    let progressPercentage = 0;
    if (latestProgress) {
      switch (latestProgress.stage) {
        case "LAND_PREPARATION":
          progressPercentage = 20;
          break;
        case "SOWING":
          progressPercentage = 40;
          break;
        case "GROWING":
          progressPercentage = 60;
          break;
        case "HARVEST_READY":
          progressPercentage = 80;
          break;
        case "HARVEST_COMPLETED":
          progressPercentage = 100;
          break;
      }
    }

    // Expected harvest date check
    const now = new Date();
    const isHarvestOverdue =
      contract.status === "ACTIVE" &&
      contract.expectedHarvestDate < now &&
      (!contract.yield || contract.yield.actualQuantity === null);

    // Stale progress check (14 days threshold)
    const activationTime = contract.activatedAt ? new Date(contract.activatedAt).getTime() : now.getTime();
    const lastProgressTime = latestProgress ? new Date(latestProgress.createdAt).getTime() : activationTime;
    const daysSinceLastProgress = (now.getTime() - lastProgressTime) / (1000 * 60 * 60 * 24);
    const hasStaleProgress = contract.status === "ACTIVE" && daysSinceLastProgress > 14;

    // Underperforming yield check (completed harvest but partial fulfillment status)
    const hasLowYield =
      latestProgress?.stage === "HARVEST_COMPLETED" &&
      contract.yield?.fulfillmentStatus === "PARTIAL";

    const monitoring = await calculateContractMonitoringState(contractId);
    const activeAlertCount = monitoring ? monitoring.activeAlertCount : 0;
    const overdueMilestoneCount = monitoring ? monitoring.overdueMilestoneCount : 0;
    const monitoringAlertsSummary = monitoring
      ? monitoring.activeAlerts.map((a: any) => ({
          id: a.id,
          title: a.title,
          message: a.message,
          severity: a.severity,
          type: a.type,
        }))
      : [];

    let health: "ON_TRACK" | "NEEDS_ATTENTION" | "COMPLETED" = "ON_TRACK";
    if (contract.status === "COMPLETED") {
      health = "COMPLETED";
    } else if (contract.status === "ACTIVE") {
      if (isHarvestOverdue || hasStaleProgress || hasLowYield || activeAlertCount > 0) {
        health = "NEEDS_ATTENTION";
      }
    }

    const harvestRecorded =
      contract.yield && contract.yield.actualQuantity !== null
        ? contract.yield.updatedAt
        : null;

    return NextResponse.json({
      status: contract.status,
      revision: contract.revision,
      currentStage: latestProgress ? latestProgress.stage : "NOT_STARTED",
      latestProgressUpdate: latestProgress
        ? {
            stage: latestProgress.stage,
            notes: latestProgress.notes,
            createdAt: latestProgress.createdAt,
          }
        : null,
      progressPercentage,
      yieldSummary: contract.yield
        ? {
            estimatedQuantity: contract.yield.estimatedQuantity,
            actualQuantity: contract.yield.actualQuantity,
            unit: contract.yield.unit,
            fulfillmentPercentage: contract.yield.fulfillmentPercentage,
            fulfillmentStatus: contract.yield.fulfillmentStatus,
          }
        : null,
      financialSummary: contract.financialAllocation
        ? {
            totalContractValue: contract.financialAllocation.totalContractValue,
            landownerAmount: contract.financialAllocation.landownerAmount,
            workforceBudget: contract.financialAllocation.workforceBudget,
            logisticsBudget: contract.financialAllocation.logisticsBudget,
            platformFee: contract.financialAllocation.platformFee,
            reserveBudget: contract.financialAllocation.reserveBudget,
            isConfigured: contract.financialAllocation.isConfigured,
          }
        : null,
      timeline: {
        proposalCreated: contract.createdAt,
        accepted: contract.decisionDate,
        activated: contract.activatedAt,
        latestProgress: latestProgress ? latestProgress.createdAt : null,
        harvestRecorded,
        completed: contract.completedAt,
      },
      health,
      overdueMilestoneCount,
      activeAlertCount,
      monitoringAlertsSummary,
    });
  } catch (error: any) {
    console.error("GET Overview Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
