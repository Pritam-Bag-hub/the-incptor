import { db } from "./db";
import { TaskStatus, TaskPriority, MilestoneStatus } from "@prisma/client";
import { getCropTasks } from "./cropTaskProvider";
import { backfillContractMilestones } from "./contractHelpers";

export interface EffectiveTask {
  id: string;
  contractId: string;
  milestoneId: string;
  title: string;
  description: string | null;
  sequence: number;
  plannedStart: Date | null;
  dueDate: Date | null;
  priority: TaskPriority;
  storedStatus: TaskStatus;
  effectiveStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE";
  daysOverdue: number;
  estimatedWorkHours: number | null;
}

/**
 * Calculates the dynamic effective status of a task.
 * If status is PENDING/IN_PROGRESS and dueDate < now, the effective status is OVERDUE.
 */
export function getEffectiveTaskStatus(
  dueDate: Date | null,
  status: TaskStatus,
  now = new Date()
): "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE" {
  if (status === TaskStatus.COMPLETED) {
    return "COMPLETED";
  }
  if (status === TaskStatus.CANCELLED) {
    return "CANCELLED";
  }
  if (dueDate !== null && new Date(dueDate).getTime() < now.getTime()) {
    return "OVERDUE";
  }
  return status as "PENDING" | "IN_PROGRESS";
}

/**
 * Calculates how many days a task's due date is overdue.
 */
export function calculateTaskDaysOverdue(dueDate: Date | null, now = new Date()): number {
  if (!dueDate) return 0;
  const diffTime = now.getTime() - new Date(dueDate).getTime();
  if (diffTime <= 0) return 0;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generates tasks for all milestones of a contract transactionally and idempotently.
 */
export async function generateTasksForContract(contractId: string, tx?: any) {
  const prismaClient = tx || db;
  const now = new Date();

  // 1. Fetch contract with milestones and crop
  let contract = await prismaClient.contract.findUnique({
    where: { id: contractId },
    include: {
      crop: true,
      milestones: {
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!contract) return null;

  // 2. Backfill milestones if missing
  if (
    (!contract.milestones || contract.milestones.length === 0) &&
    (contract.status === "ACTIVE" || contract.status === "COMPLETED")
  ) {
    await backfillContractMilestones(contractId, prismaClient);
    contract = await prismaClient.contract.findUnique({
      where: { id: contractId },
      include: {
        crop: true,
        milestones: {
          orderBy: { sequence: "asc" },
        },
      },
    });
    if (!contract) return null;
  }

  const milestones = contract.milestones || [];
  const cropName = contract.crop.name;

  // 3. For each milestone, resolve templates and distribute dates
  for (let i = 0; i < milestones.length; i++) {
    const milestone = milestones[i];
    const taskTemplates = getCropTasks(cropName, milestone.title);

    // Determine target timing boundaries
    const tStart = new Date(milestone.plannedDate);
    let tEnd = new Date(contract.expectedHarvestDate);

    if (i < milestones.length - 1) {
      tEnd = new Date(milestones[i + 1].plannedDate);
    }

    const durationMs = tEnd.getTime() - tStart.getTime();
    const isIntervalShort = durationMs <= 86400000; // less than 1 day

    const N = taskTemplates.length;

    for (let k = 0; k < N; k++) {
      const template = taskTemplates[k];

      let taskStart = new Date(tStart);
      let taskDue = new Date(tStart);

      if (!isIntervalShort && N > 0) {
        const slotWidth = durationMs / N;
        taskStart = new Date(tStart.getTime() + k * slotWidth);
        taskDue = new Date(tStart.getTime() + (k + 1) * slotWidth);
      }

      // Upsert transactionally and idempotently to avoid duplicate tasks
      await prismaClient.contractTask.upsert({
        where: {
          milestoneId_sequence: {
            milestoneId: milestone.id,
            sequence: template.sequence,
          },
        },
        create: {
          contractId: contract.id,
          milestoneId: milestone.id,
          title: template.title,
          description: template.description || null,
          sequence: template.sequence,
          plannedStart: taskStart,
          dueDate: taskDue,
          priority: template.priority,
          status: TaskStatus.PENDING,
          estimatedWorkHours: template.estimatedWorkHours || null,
        },
        update: {
          title: template.title,
          description: template.description || null,
          plannedStart: taskStart,
          dueDate: taskDue,
          estimatedWorkHours: template.estimatedWorkHours || null,
        },
      });
    }
  }

  // Return generated tasks ordered by milestone and sequence
  return await prismaClient.contractTask.findMany({
    where: { contractId },
    include: {
      milestone: true,
    },
    orderBy: [
      { milestone: { sequence: "asc" } },
      { sequence: "asc" },
    ],
  });
}

/**
 * Backfills tasks for active/completed contracts if task count is 0.
 */
export async function backfillContractTasks(contractId: string, tx?: any) {
  const prismaClient = tx || db;
  const count = await prismaClient.contractTask.count({ where: { contractId } });
  if (count === 0) {
    return await generateTasksForContract(contractId, prismaClient);
  }
  return await prismaClient.contractTask.findMany({
    where: { contractId },
    include: {
      milestone: true,
    },
    orderBy: [
      { milestone: { sequence: "asc" } },
      { sequence: "asc" },
    ],
  });
}
