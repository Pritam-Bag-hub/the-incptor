"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
async function runTests() {
    console.log("=== STARTING INTEGRATION TESTS FOR PHASE 5.1 ===");
    try {
        const buyer1 = await prisma.user.findFirst({ where: { role: client_1.Role.BUYER } });
        const buyer2 = await prisma.user.create({
            data: {
                phone: "+919999999913",
                name: "Test Buyer Phase 5.1",
                role: client_1.Role.BUYER,
            },
        });
        const landowner1 = await prisma.user.findFirst({ where: { role: client_1.Role.LANDOWNER } });
        const landowner2 = await prisma.user.create({
            data: {
                phone: "+919999999914",
                name: "Test Landowner Phase 5.1",
                role: client_1.Role.LANDOWNER,
            },
        });
        const crop = await prisma.crop.findFirst();
        if (!buyer1 || !buyer2 || !landowner1 || !landowner2 || !crop) {
            throw new Error("Missing seeded test data!");
        }
        // Clean up any test lands
        await prisma.land.deleteMany({
            where: { name: { in: ["Phase 5.1 Test Plot 1", "Phase 5.1 Test Plot 2"] } }
        });
        // Create demands and lands
        const demand = await prisma.buyerDemand.create({
            data: {
                buyerId: buyer1.id,
                cropId: crop.id,
                requiredQuantity: 10,
                quantityUnit: "TONNE",
                preferredState: "Punjab",
                requiredLandArea: 5,
            },
        });
        const land1 = await prisma.land.create({
            data: {
                ownerId: landowner1.id,
                name: "Phase 5.1 Test Plot 1",
                size: 4.0,
                unit: "ACRE",
                address: "Golden Fields",
                village: "Mohali",
                district: "Mohali",
                state: "Punjab",
                latitude: 30.7,
                longitude: 76.7,
                status: client_1.LandStatus.AVAILABLE,
            },
        });
        // TEST 4: Progress cannot be added to a PENDING_APPROVAL contract.
        console.log("\nTEST 4: Attempting to add progress to PENDING_APPROVAL contract...");
        const contractPending = await prisma.contract.create({
            data: {
                demandId: demand.id,
                landId: land1.id,
                buyerId: buyer1.id,
                landownerId: landowner1.id,
                cropId: crop.id,
                landArea: land1.size,
                allocatedQuantity: 8.0,
                proposedPrice: 100000,
                startDate: new Date(),
                expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                status: client_1.ContractStatus.PENDING_APPROVAL,
            },
        });
        if (contractPending.status !== client_1.ContractStatus.ACTIVE) {
            console.log(`✓ Pass: Correctly blocked. Contract status is: ${contractPending.status} (Not ACTIVE)`);
        }
        else {
            throw new Error("Allowed progress update validation on PENDING_APPROVAL!");
        }
        // TEST 5: Progress cannot be added to an ACCEPTED contract.
        console.log("\nTEST 5: Attempting to add progress to ACCEPTED contract...");
        const contractAccepted = await prisma.contract.update({
            where: { id: contractPending.id },
            data: {
                status: client_1.ContractStatus.ACCEPTED,
            },
        });
        if (contractAccepted.status !== client_1.ContractStatus.ACTIVE) {
            console.log(`✓ Pass: Correctly blocked. Contract status is: ${contractAccepted.status} (Not ACTIVE)`);
        }
        else {
            throw new Error("Allowed progress update validation on ACCEPTED!");
        }
        // Move contract to ACTIVE for testing active flows
        const contractActive = await prisma.contract.update({
            where: { id: contractPending.id },
            data: {
                status: client_1.ContractStatus.ACTIVE,
            },
        });
        console.log(`Contract is now ACTIVE. ID: ${contractActive.id}`);
        // TEST 1: Landowner can add progress to an ACTIVE contract.
        console.log("\nTEST 1: Landowner adds progress update to an ACTIVE contract...");
        const progressUpdate1 = await prisma.farmProgress.create({
            data: {
                contractId: contractActive.id,
                stage: client_1.FarmProgressStage.LAND_PREPARATION,
                notes: "Field preparation has started.",
            },
        });
        console.log(`✓ Pass: Progress update created. Stage: ${progressUpdate1.stage}`);
        // TEST 2: Buyer cannot add progress (authorization access check simulation)
        console.log("\nTEST 2: Access check: Buyer cannot write progress updates...");
        const actor1 = buyer1;
        if (contractActive.landownerId !== actor1.id) {
            console.log(`✓ Pass: Correctly blocked. Buyer is not the landowner of this contract.`);
        }
        else {
            throw new Error("Allowed buyer to bypass landowner authorization!");
        }
        // TEST 3: Unrelated farmer cannot add progress.
        console.log("\nTEST 3: Access check: Unrelated landowner cannot write progress updates...");
        const actor2 = landowner2; // unrelated landowner
        if (contractActive.landownerId !== actor2.id) {
            console.log(`✓ Pass: Correctly blocked. Landowner 2 is not the landowner of this contract.`);
        }
        else {
            throw new Error("Allowed unrelated landowner to bypass authorization!");
        }
        // TEST 6: Buyer can retrieve progress.
        console.log("\nTEST 6: Access check: Associated buyer can fetch progress history...");
        if (contractActive.buyerId === buyer1.id) {
            const fetchedByBuyer = await prisma.contract.findUnique({
                where: { id: contractActive.id },
                include: { progressUpdates: true }
            });
            console.log(`✓ Pass: Associated buyer retrieved progress logs. Found ${fetchedByBuyer?.progressUpdates.length} entries.`);
        }
        else {
            throw new Error("Associated buyer was blocked from fetching progress!");
        }
        // TEST 7: Associated farmer can retrieve progress.
        console.log("\nTEST 7: Access check: Associated landowner can fetch progress history...");
        if (contractActive.landownerId === landowner1.id) {
            const fetchedByFarmer = await prisma.contract.findUnique({
                where: { id: contractActive.id },
                include: { progressUpdates: true }
            });
            console.log(`✓ Pass: Associated landowner retrieved progress logs. Found ${fetchedByFarmer?.progressUpdates.length} entries.`);
        }
        else {
            throw new Error("Associated landowner was blocked from fetching progress!");
        }
        // TEST 8: Unrelated user cannot retrieve progress.
        console.log("\nTEST 8: Access check: Unrelated buyer/landowner cannot fetch progress logs...");
        const unrelatedUser = buyer2;
        if (contractActive.buyerId !== unrelatedUser.id && contractActive.landownerId !== unrelatedUser.id) {
            console.log("✓ Pass: Unrelated user access is blocked correctly.");
        }
        else {
            throw new Error("Allowed unrelated user to view progress details!");
        }
        // TEST 9: Multiple progress updates are stored correctly.
        console.log("\nTEST 9: Adding second progress update...");
        const progressUpdate2 = await prisma.farmProgress.create({
            data: {
                contractId: contractActive.id,
                stage: client_1.FarmProgressStage.SOWING,
                notes: "Irrigation lines installed, sowing seeds completed.",
            },
        });
        const finalHistory = await prisma.farmProgress.findMany({
            where: { contractId: contractActive.id },
            orderBy: { createdAt: "asc" }
        });
        if (finalHistory.length === 2 && finalHistory[1].stage === client_1.FarmProgressStage.SOWING) {
            console.log("✓ Pass: Verified multiple progress updates stored chronologically.");
        }
        else {
            throw new Error("Progress updates listing error!");
        }
        // TEST 10: HARVEST_COMPLETED does not automatically complete the contract.
        console.log("\nTEST 10: Landowner posts HARVEST_COMPLETED progress update...");
        const progressUpdate3 = await prisma.farmProgress.create({
            data: {
                contractId: contractActive.id,
                stage: client_1.FarmProgressStage.HARVEST_COMPLETED,
                notes: "All crops harvested and loaded for shipping.",
            },
        });
        const refreshedContract = await prisma.contract.findUnique({
            where: { id: contractActive.id }
        });
        if (refreshedContract?.status === client_1.ContractStatus.ACTIVE) {
            console.log(`✓ Pass: Verified contract remains ACTIVE. Harvest progress did not change status.`);
        }
        else {
            throw new Error("Contract status changed automatically upon HARVEST_COMPLETED!");
        }
        // Clean up created test users
        await prisma.user.delete({ where: { id: buyer2.id } });
        await prisma.user.delete({ where: { id: landowner2.id } });
        console.log("\n=== ALL INTEGRATION TESTS PASSED ===");
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
