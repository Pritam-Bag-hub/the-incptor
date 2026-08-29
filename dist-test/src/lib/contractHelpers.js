"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillFinancialAllocation = backfillFinancialAllocation;
exports.backfillContractYield = backfillContractYield;
exports.generateMilestonesForContract = generateMilestonesForContract;
exports.backfillContractMilestones = backfillContractMilestones;
const db_1 = require("./db");
const client_1 = require("@prisma/client");
const cropDataProvider_1 = require("./cropDataProvider");
async function backfillFinancialAllocation(contractId, tx) {
    const prismaClient = tx || db_1.db;
    // 1. Fetch contract
    const contract = await prismaClient.contract.findUnique({
        where: { id: contractId },
        include: { financialAllocation: true },
    });
    if (!contract)
        return null;
    // Only eligible if ACCEPTED, ACTIVE, or COMPLETED
    if (contract.status !== "ACCEPTED" &&
        contract.status !== "ACTIVE" &&
        contract.status !== "COMPLETED") {
        return null;
    }
    // Already exists
    if (contract.financialAllocation) {
        return contract.financialAllocation;
    }
    const val = contract.proposedPrice;
    return await prismaClient.contractFinancialAllocation.upsert({
        where: { contractId },
        create: {
            contractId,
            totalContractValue: val,
            landownerAmount: val * 0.50,
            workforceBudget: val * 0.25,
            logisticsBudget: val * 0.10,
            platformFee: val * 0.10,
            reserveBudget: val * 0.05,
            isConfigured: false,
        },
        update: {}, // do not change if exists
    });
}
async function backfillContractYield(contractId, tx) {
    const prismaClient = tx || db_1.db;
    // 1. Fetch contract with crop and demand
    const contract = await prismaClient.contract.findUnique({
        where: { id: contractId },
        include: { yield: true, crop: true, demand: true },
    });
    if (!contract)
        return null;
    // Only eligible if ACTIVE or COMPLETED
    if (contract.status !== "ACTIVE" && contract.status !== "COMPLETED") {
        return null;
    }
    // Already exists
    if (contract.yield) {
        return contract.yield;
    }
    let estQty = null;
    if (contract.crop?.metadataJson) {
        try {
            const meta = JSON.parse(contract.crop.metadataJson);
            const yieldPerAcre = parseFloat(meta.expectedYieldPerAcre);
            if (!isNaN(yieldPerAcre) && yieldPerAcre > 0) {
                estQty = yieldPerAcre * contract.landArea;
            }
        }
        catch (e) {
            console.error("Failed to parse crop metadataJson for yield backfill:", e);
        }
    }
    return await prismaClient.contractYield.upsert({
        where: { contractId },
        create: {
            contractId,
            estimatedQuantity: estQty,
            actualQuantity: null,
            unit: contract.demand?.quantityUnit || "TONNE",
            fulfillmentStatus: client_1.FulfillmentStatus.PENDING,
        },
        update: {}, // do not change if exists
    });
}
async function generateMilestonesForContract(contractId, tx) {
    const prismaClient = tx || db_1.db;
    // 1. Fetch contract with crop details and existing milestones
    const contract = await prismaClient.contract.findUnique({
        where: { id: contractId },
        include: { crop: true, milestones: true },
    });
    if (!contract)
        return null;
    // 2. If milestones already exist, return them
    if (contract.milestones && contract.milestones.length > 0) {
        return contract.milestones;
    }
    // 3. Resolve templates using cropDataProvider
    const stages = await (0, cropDataProvider_1.getCropStages)(contract.cropId, contract.crop.name);
    // 4. Calculate milestone planned dates
    const startMs = new Date(contract.startDate).getTime();
    const endMs = new Date(contract.expectedHarvestDate).getTime();
    const diff = endMs - startMs;
    const N = stages.length;
    const milestoneDates = [];
    if (diff <= 0 || N <= 1) {
        // Spaced sequentially by 1 day starting from startDate
        for (let i = 0; i < N; i++) {
            milestoneDates.push(new Date(startMs + i * 24 * 60 * 60 * 1000));
        }
    }
    else {
        // Check if we have duration weights (either recommendedDurationDays or durationPercentage)
        let hasWeights = false;
        const weights = [];
        for (let i = 0; i < N - 1; i++) {
            const stage = stages[i];
            const w = stage.recommendedDurationDays || stage.durationPercentage || 0;
            weights.push(w);
            if (w > 0) {
                hasWeights = true;
            }
        }
        if (hasWeights) {
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);
            if (totalWeight > 0) {
                milestoneDates.push(new Date(startMs));
                let currentMs = startMs;
                for (let i = 0; i < N - 2; i++) {
                    const interval = diff * (weights[i] / totalWeight);
                    currentMs += interval;
                    milestoneDates.push(new Date(currentMs));
                }
                milestoneDates.push(new Date(endMs));
            }
            else {
                hasWeights = false;
            }
        }
        if (!hasWeights) {
            // Linear even distribution
            const interval = diff / (N - 1);
            for (let i = 0; i < N; i++) {
                milestoneDates.push(new Date(startMs + i * interval));
            }
        }
    }
    // 5. Generate ContractMilestone records idempotently
    const createdMilestones = [];
    for (let i = 0; i < N; i++) {
        const stage = stages[i];
        const plannedDate = milestoneDates[i];
        const milestone = await prismaClient.contractMilestone.upsert({
            where: {
                contractId_sequence: {
                    contractId,
                    sequence: stage.sequence,
                },
            },
            create: {
                contractId,
                title: stage.title,
                sequence: stage.sequence,
                plannedDate,
                status: client_1.MilestoneStatus.PENDING,
            },
            update: {}, // do not change status if already exists
        });
        createdMilestones.push(milestone);
    }
    return createdMilestones;
}
async function backfillContractMilestones(contractId, tx) {
    const prismaClient = tx || db_1.db;
    const contract = await prismaClient.contract.findUnique({
        where: { id: contractId },
    });
    if (!contract)
        return null;
    // Backfill only eligible statuses (ACTIVE or COMPLETED)
    if (contract.status !== "ACTIVE" && contract.status !== "COMPLETED") {
        return null;
    }
    return await generateMilestonesForContract(contractId, prismaClient);
}
