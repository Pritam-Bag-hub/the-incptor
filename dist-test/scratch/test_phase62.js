"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const contractMonitoring_1 = require("../src/lib/contractMonitoring");
const contractHelpers_1 = require("../src/lib/contractHelpers");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
async function runTests() {
    console.log("=== STARTING INTEGRATION TESTS FOR PHASE 6.2 ===");
    try {
        // 1. Setup clean test users
        await prisma.user.deleteMany({
            where: { phone: { in: ["+919999999911", "+919999999912", "+919999999913"] } },
        });
        const buyer = await prisma.user.create({
            data: { phone: "+919999999911", name: "Monitor Buyer", role: client_1.Role.BUYER },
        });
        const landowner = await prisma.user.create({
            data: { phone: "+919999999912", name: "Monitor Landowner", role: client_1.Role.LANDOWNER },
        });
        const unrelatedUser = await prisma.user.create({
            data: { phone: "+919999999913", name: "Unrelated User", role: client_1.Role.BUYER },
        });
        // Setup crop category and crop
        let crop = await prisma.crop.findFirst({ where: { name: "Sunflower" } });
        if (!crop) {
            let category = await prisma.cropCategory.findFirst();
            if (!category) {
                category = await prisma.cropCategory.create({ data: { name: "Oilseeds" } });
            }
            crop = await prisma.crop.create({
                data: { name: "Sunflower", durationDays: 90, categoryId: category.id },
            });
        }
        // Setup land
        const land = await prisma.land.create({
            data: {
                ownerId: landowner.id,
                name: "Alert Field 1",
                size: 5.0,
                unit: "ACRE",
                address: "Alert Farms",
                village: "Alert",
                district: "Alert",
                state: "Punjab",
                latitude: 31.0,
                longitude: 76.0,
                status: client_1.LandStatus.UNDER_CONTRACT,
            },
        });
        const land2 = await prisma.land.create({
            data: {
                ownerId: landowner.id,
                name: "Alert Field 2",
                size: 5.0,
                unit: "ACRE",
                address: "Alert Farms 2",
                village: "Alert",
                district: "Alert",
                state: "Punjab",
                latitude: 31.0,
                longitude: 76.0,
                status: client_1.LandStatus.UNDER_CONTRACT,
            },
        });
        const land3 = await prisma.land.create({
            data: {
                ownerId: landowner.id,
                name: "Alert Field 3",
                size: 5.0,
                unit: "ACRE",
                address: "Alert Farms 3",
                village: "Alert",
                district: "Alert",
                state: "Punjab",
                latitude: 31.0,
                longitude: 76.0,
                status: client_1.LandStatus.UNDER_CONTRACT,
            },
        });
        // Create contract
        const demand = await prisma.buyerDemand.create({
            data: {
                buyerId: buyer.id,
                cropId: crop.id,
                requiredQuantity: 10.0,
                quantityUnit: "TONNE",
                preferredState: "Punjab",
                status: "ACTIVE",
            },
        });
        const contract = await prisma.contract.create({
            data: {
                demandId: demand.id,
                landId: land.id,
                buyerId: buyer.id,
                landownerId: landowner.id,
                cropId: crop.id,
                landArea: 5.0,
                allocatedQuantity: 10.0,
                proposedPrice: 120000,
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                expectedHarvestDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days in future
                status: client_1.ContractStatus.ACTIVE,
            },
        });
        // Generate milestones
        await (0, contractHelpers_1.generateMilestonesForContract)(contract.id, prisma);
        // Test 1: Future milestone is not overdue
        console.log("\nTest 1: Future milestones are not overdue...");
        const milestones = await prisma.contractMilestone.findMany({ where: { contractId: contract.id } });
        const futureMilestone = milestones.find((m) => m.sequence === 5); // Harvest Completed is on expectedHarvestDate
        if (futureMilestone) {
            const effStatus = (0, contractMonitoring_1.getEffectiveMilestoneStatus)(futureMilestone.plannedDate, futureMilestone.status);
            if (effStatus === "PENDING" || effStatus === "IN_PROGRESS") {
                console.log("✓ Pass: Future milestone is correctly classified as pending/in-progress.");
            }
            else {
                throw new Error(`Expected pending/in-progress, got: ${effStatus}`);
            }
        }
        // Test 2 & 3: Past milestones are detected as overdue (effective status only)
        console.log("Test 2 & 3: Past PENDING/IN_PROGRESS milestones have effective status OVERDUE...");
        // Force set sequence 1 plannedDate to 10 days ago
        const seq1 = milestones.find((m) => m.sequence === 1);
        if (!seq1)
            throw new Error("Sequence 1 milestone not found!");
        await prisma.contractMilestone.update({
            where: { id: seq1.id },
            data: { plannedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        });
        const updatedSeq1 = await prisma.contractMilestone.findUnique({ where: { id: seq1.id } });
        const effStatus = (0, contractMonitoring_1.getEffectiveMilestoneStatus)(updatedSeq1.plannedDate, updatedSeq1.status);
        if (effStatus === "OVERDUE") {
            console.log("✓ Pass: Past PENDING milestone has effective status OVERDUE.");
        }
        else {
            throw new Error(`Expected OVERDUE, got: ${effStatus}`);
        }
        // Test 4: Database stored status must not be modified dynamically
        console.log("Test 4: Database status remains PENDING despite being overdue...");
        if (updatedSeq1.status === client_1.MilestoneStatus.PENDING) {
            console.log("✓ Pass: Stored status remains unchanged.");
        }
        else {
            throw new Error(`Expected stored status to be PENDING, got: ${updatedSeq1.status}`);
        }
        // Test 5: Completed milestones must never become overdue
        console.log("Test 5: Completed milestones do not become overdue even if planned date has passed...");
        await prisma.contractMilestone.update({
            where: { id: seq1.id },
            data: { status: client_1.MilestoneStatus.COMPLETED, completedAt: new Date() },
        });
        const completedSeq1 = await prisma.contractMilestone.findUnique({ where: { id: seq1.id } });
        const completedEffStatus = (0, contractMonitoring_1.getEffectiveMilestoneStatus)(completedSeq1.plannedDate, completedSeq1.status);
        if (completedEffStatus === "COMPLETED") {
            console.log("✓ Pass: Completed milestone maintains COMPLETED effective status.");
        }
        else {
            throw new Error(`Expected COMPLETED, got: ${completedEffStatus}`);
        }
        // Test 6 & 7: Completing an overdue milestone resolves the active alert
        console.log("Test 6 & 7: Completing milestone resolves overdue alerts instead of deleting...");
        // 1. Reset milestone to PENDING (so it becomes overdue again)
        await prisma.contractMilestone.update({
            where: { id: seq1.id },
            data: { status: client_1.MilestoneStatus.PENDING, completedAt: null },
        });
        // 2. Compute state to generate alert
        await (0, contractMonitoring_1.calculateContractMonitoringState)(contract.id, prisma);
        let activeAlert = await prisma.contractAlert.findFirst({
            where: {
                contractId: contract.id,
                type: client_1.ContractAlertType.MILESTONE_OVERDUE,
                title: "Land Preparation milestone overdue",
                isResolved: false,
            },
        });
        if (!activeAlert)
            throw new Error("Overdue alert not generated!");
        console.log("DEBUG: activeAlert generated:", activeAlert);
        // 3. Mark milestone as COMPLETED
        await prisma.contractMilestone.update({
            where: { id: seq1.id },
            data: { status: client_1.MilestoneStatus.COMPLETED, completedAt: new Date() },
        });
        // 4. Compute state again to resolve alert
        const state = await (0, contractMonitoring_1.calculateContractMonitoringState)(contract.id, prisma);
        console.log("DEBUG: all alerts in returned state:", state?.alerts);
        const resolvedAlert = await prisma.contractAlert.findUnique({ where: { id: activeAlert.id } });
        console.log("DEBUG: resolvedAlert loaded from DB:", resolvedAlert);
        if (resolvedAlert && resolvedAlert.isResolved && resolvedAlert.resolvedAt !== null) {
            console.log("✓ Pass: Milestone overdue alert successfully marked as resolved with timestamp.");
        }
        else {
            throw new Error("Milestone alert was not resolved correctly!");
        }
        // Test 8: Duplicate active alerts are prevented
        console.log("Test 8: Prevent duplicate active alerts for the same milestone...");
        // Reset to PENDING again to make it overdue
        await prisma.contractMilestone.update({
            where: { id: seq1.id },
            data: { status: client_1.MilestoneStatus.PENDING, completedAt: null },
        });
        await (0, contractMonitoring_1.calculateContractMonitoringState)(contract.id, prisma);
        await (0, contractMonitoring_1.calculateContractMonitoringState)(contract.id, prisma); // double call
        const alertCount = await prisma.contractAlert.count({
            where: {
                contractId: contract.id,
                type: client_1.ContractAlertType.MILESTONE_OVERDUE,
                title: "Land Preparation milestone overdue",
                isResolved: false,
            },
        });
        if (alertCount === 1) {
            console.log("✓ Pass: Duplicate active alerts prevented successfully.");
        }
        else {
            throw new Error(`Expected exactly 1 active alert, found: ${alertCount}`);
        }
        // Test 12 & 13: Harvest delay alerts generate and resolve properly
        console.log("Test 12 & 13: Expected harvest date passed triggers HARVEST_DELAY alert...");
        const harvestContract = await prisma.contract.create({
            data: {
                demandId: demand.id,
                landId: land2.id,
                buyerId: buyer.id,
                landownerId: landowner.id,
                cropId: crop.id,
                landArea: 5.0,
                allocatedQuantity: 10.0,
                proposedPrice: 120000,
                startDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), // 95 days ago
                expectedHarvestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (Passed expected harvest!)
                status: client_1.ContractStatus.ACTIVE,
            },
        });
        await (0, contractHelpers_1.generateMilestonesForContract)(harvestContract.id, prisma);
        await (0, contractMonitoring_1.calculateContractMonitoringState)(harvestContract.id, prisma);
        let harvestAlert = await prisma.contractAlert.findFirst({
            where: { contractId: harvestContract.id, type: client_1.ContractAlertType.HARVEST_DELAY },
        });
        if (harvestAlert && !harvestAlert.isResolved) {
            console.log("✓ Pass: Harvest delay alert successfully created.");
        }
        else {
            throw new Error("Harvest delay alert not generated!");
        }
        // Completing the contract resolves the harvest delay alert
        await prisma.contract.update({
            where: { id: harvestContract.id },
            data: { status: client_1.ContractStatus.COMPLETED, completedAt: new Date() },
        });
        await (0, contractMonitoring_1.calculateContractMonitoringState)(harvestContract.id, prisma);
        harvestAlert = await prisma.contractAlert.findFirst({
            where: { contractId: harvestContract.id, type: client_1.ContractAlertType.HARVEST_DELAY },
        });
        if (harvestAlert && harvestAlert.isResolved) {
            console.log("✓ Pass: Harvest delay alert successfully marked as resolved on completion.");
        }
        else {
            throw new Error("Harvest delay alert was not resolved!");
        }
        // Test 14 & 15 & 16: Dynamic Contract Health states
        console.log("Test 14 & 15 & 16: Dynamic contract health calculation states...");
        const stateActiveOverdue = await (0, contractMonitoring_1.calculateContractMonitoringState)(contract.id, prisma);
        if (stateActiveOverdue.health === "NEEDS_ATTENTION") {
            console.log("✓ Pass: Health is NEEDS_ATTENTION when active alerts exist.");
        }
        else {
            throw new Error(`Expected health NEEDS_ATTENTION, got: ${stateActiveOverdue.health}`);
        }
        // Create an on-track contract with dates in the future (no milestones are overdue)
        const onTrackContract = await prisma.contract.create({
            data: {
                demandId: demand.id,
                landId: land3.id,
                buyerId: buyer.id,
                landownerId: landowner.id,
                cropId: crop.id,
                landArea: 5.0,
                allocatedQuantity: 10.0,
                proposedPrice: 120000,
                startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // starts in 5 days
                expectedHarvestDate: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000), // 95 days in future
                status: client_1.ContractStatus.ACTIVE,
            },
        });
        await (0, contractHelpers_1.generateMilestonesForContract)(onTrackContract.id, prisma);
        const stateActiveOnTrack = await (0, contractMonitoring_1.calculateContractMonitoringState)(onTrackContract.id, prisma);
        if (stateActiveOnTrack.health === "ON_TRACK") {
            console.log("✓ Pass: Health is ON_TRACK when active alerts are cleared/none exist.");
        }
        else {
            throw new Error(`Expected health ON_TRACK, got: ${stateActiveOnTrack.health}`);
        }
        const stateCompleted = await (0, contractMonitoring_1.calculateContractMonitoringState)(harvestContract.id, prisma);
        if (stateCompleted.health === "COMPLETED") {
            console.log("✓ Pass: Health is COMPLETED when contract status is COMPLETED.");
        }
        else {
            throw new Error(`Expected health COMPLETED, got: ${stateCompleted.health}`);
        }
        // Cleanup test data
        console.log("\nCleaning up alert integration test data...");
        await prisma.contractAlert.deleteMany({
            where: { contractId: { in: [contract.id, harvestContract.id, onTrackContract.id] } },
        });
        await prisma.contractMilestone.deleteMany({
            where: { contractId: { in: [contract.id, harvestContract.id, onTrackContract.id] } },
        });
        await prisma.contract.deleteMany({
            where: { id: { in: [contract.id, harvestContract.id, onTrackContract.id] } },
        });
        await prisma.land.deleteMany({ where: { id: { in: [land.id, land2.id, land3.id] } } });
        await prisma.buyerDemand.delete({ where: { id: demand.id } });
        await prisma.user.delete({ where: { id: buyer.id } });
        await prisma.user.delete({ where: { id: landowner.id } });
        await prisma.user.delete({ where: { id: unrelatedUser.id } });
        console.log("\n=== ALL MONITORING INTEGRATION TESTS PASSED ===");
    }
    catch (error) {
        console.error("\n✗ TEST RUNNER ENCOUNTERED ERROR:", error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
runTests();
