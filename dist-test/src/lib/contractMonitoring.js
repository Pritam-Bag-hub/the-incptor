"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEffectiveMilestoneStatus = getEffectiveMilestoneStatus;
exports.calculateDaysOverdue = calculateDaysOverdue;
exports.calculateContractMonitoringState = calculateContractMonitoringState;
const db_1 = require("./db");
const client_1 = require("@prisma/client");
const contractHelpers_1 = require("./contractHelpers");
/**
 * Calculates the dynamic effective status of a milestone.
 * Stored status is PENDING/IN_PROGRESS but if plannedDate < now, the effective status is OVERDUE.
 */
function getEffectiveMilestoneStatus(plannedDate, status, now = new Date()) {
    if (status === client_1.MilestoneStatus.COMPLETED) {
        return "COMPLETED";
    }
    if (new Date(plannedDate).getTime() < now.getTime()) {
        return "OVERDUE";
    }
    return status;
}
/**
 * Calculates how many days a milestone or expected harvest is overdue.
 */
function calculateDaysOverdue(date, now = new Date()) {
    const diffTime = now.getTime() - new Date(date).getTime();
    if (diffTime <= 0)
        return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
/**
 * Synchronizes overdue milestones and harvest delays, generating or resolving alerts.
 */
async function calculateContractMonitoringState(contractId, tx) {
    const prismaClient = tx || db_1.db;
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
    if (!contract)
        return null;
    // 2. Backfill milestones if active or completed and milestones count is 0
    if ((!contract.milestones || contract.milestones.length === 0) &&
        (contract.status === "ACTIVE" || contract.status === "COMPLETED")) {
        await (0, contractHelpers_1.backfillContractMilestones)(contractId, prismaClient);
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
        if (!contract)
            return null;
    }
    const milestones = contract.milestones || [];
    const alerts = contract.alerts || [];
    const progressUpdates = contract.progressUpdates || [];
    let overdueMilestoneCount = 0;
    const effectiveMilestones = [];
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
            const severity = daysOverdue > 5 ? client_1.AlertSeverity.CRITICAL : client_1.AlertSeverity.WARNING;
            const message = `The ${ms.title} milestone is overdue by ${daysOverdue} days.`;
            await prismaClient.contractAlert.upsert({
                where: {
                    contractId_type_title: {
                        contractId,
                        type: client_1.ContractAlertType.MILESTONE_OVERDUE,
                        title: alertTitle,
                    },
                },
                create: {
                    contractId,
                    milestoneId: ms.id,
                    type: client_1.ContractAlertType.MILESTONE_OVERDUE,
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
        }
        else {
            // Milestone is completed or future - check if active alert needs to be resolved
            const existingAlert = alerts.find((a) => a.type === client_1.ContractAlertType.MILESTONE_OVERDUE && a.title === alertTitle);
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
        const severity = daysDelayed > 5 ? client_1.AlertSeverity.CRITICAL : client_1.AlertSeverity.WARNING;
        const message = `Expected harvest date has passed. Harvesting has not been completed. Delayed by ${daysDelayed} days.`;
        await prismaClient.contractAlert.upsert({
            where: {
                contractId_type_title: {
                    contractId,
                    type: client_1.ContractAlertType.HARVEST_DELAY,
                    title: harvestAlertTitle,
                },
            },
            create: {
                contractId,
                type: client_1.ContractAlertType.HARVEST_DELAY,
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
    }
    else {
        // Contract not active or harvest date not passed - resolve if active alert exists
        const existingHarvestAlert = alerts.find((a) => a.type === client_1.ContractAlertType.HARVEST_DELAY && a.title === harvestAlertTitle);
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
    if (contract.status === "ACTIVE" &&
        progressUpdates.length === 0 &&
        daysSinceStart > progressLimitDays) {
        const message = `No farm progress has been reported within ${progressLimitDays} days of contract start.`;
        await prismaClient.contractAlert.upsert({
            where: {
                contractId_type_title: {
                    contractId,
                    type: client_1.ContractAlertType.PROGRESS_DELAY,
                    title: progressAlertTitle,
                },
            },
            create: {
                contractId,
                type: client_1.ContractAlertType.PROGRESS_DELAY,
                severity: client_1.AlertSeverity.WARNING,
                title: progressAlertTitle,
                message,
                isResolved: false,
            },
            update: {
                isResolved: false,
                resolvedAt: null,
            },
        });
    }
    else {
        // If progress is reported or contract is not active, resolve the alert
        const existingProgressAlert = alerts.find((a) => a.type === client_1.ContractAlertType.PROGRESS_DELAY && a.title === progressAlertTitle);
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
    const activeAlerts = finalAlerts.filter((a) => !a.isResolved);
    const activeAlertCount = activeAlerts.length;
    // 7. Calculate Health dynamically (explainable)
    let health = "ON_TRACK";
    if (contract.status === "COMPLETED") {
        health = "COMPLETED";
    }
    else if (activeAlertCount > 0) {
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
