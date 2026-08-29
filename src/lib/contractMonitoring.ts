import { db } from "./db";
import { ContractAlertType, AlertSeverity, MilestoneStatus } from "@prisma/client";
import { backfillContractMilestones } from "./contractHelpers";

export interface EffectiveMilestone {
  id: string;
  title: string;
  sequence: number;
  plannedDate: Date;
  completedAt: Date | null;
  storedStatus: MilestoneStatus;
  effectiveStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  daysOverdue: number;
}

/**
 * Calculates the dynamic effective status of a milestone.
 * Stored status is PENDING/IN_PROGRESS but if plannedDate < now, the effective status is OVERDUE.
 */
export function getEffectiveMilestoneStatus(
  plannedDate: Date,
  status: MilestoneStatus,
  now = new Date()
): "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" {
  if (status === MilestoneStatus.COMPLETED) {
    return "COMPLETED";
  }
  if (new Date(plannedDate).getTime() < now.getTime()) {
    return "OVERDUE";
  }
  return status as "PENDING" | "IN_PROGRESS";
}

/**
 * Calculates how many days a milestone or expected harvest is overdue.
 */
export function calculateDaysOverdue(date: Date, now = new Date()): number {
  const diffTime = now.getTime() - new Date(date).getTime();
  if (diffTime <= 0) return 0;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Synchronizes overdue milestones and harvest delays, generating or resolving alerts.
 */
export async function calculateContractMonitoringState(contractId: string, tx?: any) {
  const prismaClient = tx || db;
  const now = new Date();

  // 1. Fetch contract with milestones, alerts, progress updates, and crop details
  let contract = await prismaClient.contract.findUnique({
    where: { id: contractId },
    include: {
      crop: true,
      milestones: true,
      alerts: true,
      progressUpdates: true,
    },
  });

  if (!contract) return null;

  // 2. Backfill milestones if active or completed and milestones count is 0
  if (
    (!contract.milestones || contract.milestones.length === 0) &&
    (contract.status === "ACTIVE" || contract.status === "COMPLETED")
  ) {
    await backfillContractMilestones(contractId, prismaClient);
    // Re-fetch contract with backfilled milestones
    contract = await prismaClient.contract.findUnique({
      where: { id: contractId },
      include: {
        crop: true,
        milestones: true,
        alerts: true,
        progressUpdates: true,
      },
    });
    if (!contract) return null;
  }

  const milestones = contract.milestones || [];
  const alerts = contract.alerts || [];
  const progressUpdates = contract.progressUpdates || [];

  let overdueMilestoneCount = 0;
  const effectiveMilestones: EffectiveMilestone[] = [];

  // 3. Process each milestone to detect overdue state and upsert/resolve alerts
  for (const ms of milestones) {
    const effStatus = getEffectiveMilestoneStatus(ms.plannedDate, ms.status, now);
    const daysOverdue = effStatus === "OVERDUE" ? calculateDaysOverdue(ms.plannedDate, now) : 0;

    if (effStatus === "OVERDUE") {
      overdueMilestoneCount++;
    }

    effectiveMilestones.push({
      id: ms.id,
      title: ms.title,
      sequence: ms.sequence,
      plannedDate: ms.plannedDate,
      completedAt: ms.completedAt,
      storedStatus: ms.status,
      effectiveStatus: effStatus,
      daysOverdue,
    });

    const alertTitle = `${ms.title} milestone overdue`;

    if (effStatus === "OVERDUE") {
      // Overdue alert is active
      const severity = daysOverdue > 5 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
      const message = `The ${ms.title} milestone is overdue by ${daysOverdue} days.`;

      await prismaClient.contractAlert.upsert({
        where: {
          contractId_type_title: {
            contractId,
            type: ContractAlertType.MILESTONE_OVERDUE,
            title: alertTitle,
          },
        },
        create: {
          contractId,
          milestoneId: ms.id,
          type: ContractAlertType.MILESTONE_OVERDUE,
          severity,
          title: alertTitle,
          message,
          isResolved: false,
        },
        update: {
          severity,
          message,
          isResolved: false,
          resolvedAt: null,
        },
      });
    } else {
      // Milestone is completed or future - check if active alert needs to be resolved
      const existingAlert = alerts.find(
        (a: any) => a.type === ContractAlertType.MILESTONE_OVERDUE && a.title === alertTitle
      );
      if (existingAlert && !existingAlert.isResolved) {
        await prismaClient.contractAlert.update({
          where: { id: existingAlert.id },
          data: {
            isResolved: true,
            resolvedAt: now,
          },
        });
      }
    }
  }

  // 4. Harvest Delay Detection
  const isHarvestCompleted = contract.status === "COMPLETED";
  const expectedHarvest = new Date(contract.expectedHarvestDate);
  const isHarvestPassed = expectedHarvest.getTime() < now.getTime();
  const harvestAlertTitle = "Expected harvest date passed";

  if (contract.status === "ACTIVE" && isHarvestPassed && !isHarvestCompleted) {
    const daysDelayed = calculateDaysOverdue(contract.expectedHarvestDate, now);
    const severity = daysDelayed > 5 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
    const message = `Expected harvest date has passed. Harvesting has not been completed. Delayed by ${daysDelayed} days.`;

    await prismaClient.contractAlert.upsert({
      where: {
        contractId_type_title: {
          contractId,
          type: ContractAlertType.HARVEST_DELAY,
          title: harvestAlertTitle,
        },
      },
      create: {
        contractId,
        type: ContractAlertType.HARVEST_DELAY,
        severity,
        title: harvestAlertTitle,
        message,
        isResolved: false,
      },
      update: {
        severity,
        message,
        isResolved: false,
        resolvedAt: null,
      },
    });
  } else {
    // Contract not active or harvest date not passed - resolve if active alert exists
    const existingHarvestAlert = alerts.find(
        (a: any) => a.type === ContractAlertType.HARVEST_DELAY && a.title === harvestAlertTitle
    );
    if (existingHarvestAlert && !existingHarvestAlert.isResolved) {
      await prismaClient.contractAlert.update({
        where: { id: existingHarvestAlert.id },
        data: {
          isResolved: true,
          resolvedAt: now,
        },
      });
    }
  }

  // 5. Progress Delay Detection
  // Rule: If contract is ACTIVE and has 0 FarmProgress reports after 15 days from start date
  const start = new Date(contract.startDate);
  const daysSinceStart = calculateDaysOverdue(contract.startDate, now);
  const progressAlertTitle = "Initial progress reporting delay";
  const progressLimitDays = 15;

  if (
    contract.status === "ACTIVE" &&
    progressUpdates.length === 0 &&
    daysSinceStart > progressLimitDays
  ) {
    const message = `No farm progress has been reported within ${progressLimitDays} days of contract start.`;

    await prismaClient.contractAlert.upsert({
      where: {
        contractId_type_title: {
          contractId,
          type: ContractAlertType.PROGRESS_DELAY,
          title: progressAlertTitle,
        },
      },
      create: {
        contractId,
        type: ContractAlertType.PROGRESS_DELAY,
        severity: AlertSeverity.WARNING,
        title: progressAlertTitle,
        message,
        isResolved: false,
      },
      update: {
        isResolved: false,
        resolvedAt: null,
      },
    });
  } else {
    // If progress is reported or contract is not active, resolve the alert
    const existingProgressAlert = alerts.find(
        (a: any) => a.type === ContractAlertType.PROGRESS_DELAY && a.title === progressAlertTitle
    );
    if (existingProgressAlert && !existingProgressAlert.isResolved) {
      await prismaClient.contractAlert.update({
        where: { id: existingProgressAlert.id },
        data: {
          isResolved: true,
          resolvedAt: now,
        },
      });
    }
  }

  // 6. Fetch final synchronized alerts
  const finalAlerts = await prismaClient.contractAlert.findMany({
    where: { contractId },
    orderBy: { createdAt: "desc" },
  });

  const activeAlerts = finalAlerts.filter((a: any) => !a.isResolved);
  const activeAlertCount = activeAlerts.length;

  // 7. Calculate Health dynamically (explainable)
  let health: "ON_TRACK" | "NEEDS_ATTENTION" | "COMPLETED" = "ON_TRACK";
  if (contract.status === "COMPLETED") {
    health = "COMPLETED";
  } else if (activeAlertCount > 0) {
    health = "NEEDS_ATTENTION";
  }

  return {
    contract,
    milestones: effectiveMilestones,
    alerts: finalAlerts,
    activeAlerts,
    overdueMilestoneCount,
    activeAlertCount,
    health,
  };
}
