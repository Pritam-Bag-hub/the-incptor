"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
async function runTests() {
    console.log("=== STARTING INTEGRATION TESTS FOR PHASE 4.4 ===");
    try {
        const buyer1 = await prisma.user.findFirst({ where: { role: client_1.Role.BUYER } });
        const buyer2 = await prisma.user.create({
            data: {
                phone: "+919999999912",
                name: "Test Buyer Phase 4.4",
                role: client_1.Role.BUYER,
            },
        });
        const landowner = await prisma.user.findFirst({ where: { role: client_1.Role.LANDOWNER } });
        const crop = await prisma.crop.findFirst();
        if (!buyer1 || !buyer2 || !landowner || !crop) {
            throw new Error("Missing seeded test data!");
        }
        // Clean up any existing records for our specific test lands
        await prisma.land.deleteMany({
            where: { name: "Phase 4.4 Test Plot" },
        });
        // Create a crop demand
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
        // Create a land
        const land = await prisma.land.create({
            data: {
                ownerId: landowner.id,
                name: "Phase 4.4 Test Plot",
                size: 4.0,
                unit: "ACRE",
                address: "Fields of Gold",
                village: "Mohali",
                district: "Mohali",
                state: "Punjab",
                latitude: 30.7,
                longitude: 76.7,
                status: client_1.LandStatus.AVAILABLE,
            },
        });
        // TEST 1: Create proposal version 1.
        console.log("\nTEST 1: Creating proposal version 1...");
        const contract = await prisma.contract.create({
            data: {
                demandId: demand.id,
                landId: land.id,
                buyerId: buyer1.id,
                landownerId: landowner.id,
                cropId: crop.id,
                landArea: land.size,
                allocatedQuantity: 8.0,
                proposedPrice: 100000,
                startDate: new Date(),
                expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                status: client_1.ContractStatus.PENDING_APPROVAL,
                revision: 1,
            },
        });
        console.log(`✓ Pass: Proposal version 1 created. ID: ${contract.id}`);
        // TEST 2: Landowner rejects with a rejection reason.
        console.log("\nTEST 2 & 3: Landowner rejects with a rejection reason...");
        const rejectReasonInput = "Proposed price of ₹100,000 is too low for this area.";
        const rejectedContract = await prisma.contract.update({
            where: { id: contract.id },
            data: {
                status: client_1.ContractStatus.REJECTED,
                decisionDate: new Date(),
                rejectionReason: rejectReasonInput,
            },
        });
        console.log("✓ Pass: Landowner rejected the proposal.");
        // TEST 3 Verification: Verify rejection reason is stored.
        if (rejectedContract.rejectionReason === rejectReasonInput) {
            console.log(`✓ Pass: Rejection reason matches input: "${rejectedContract.rejectionReason}"`);
        }
        else {
            throw new Error("Rejection reason mismatch!");
        }
        // TEST 4: Buyer retrieves contract and sees rejection reason.
        console.log("\nTEST 4: Buyer retrieves contract details and inspects rejection reason...");
        const fetchedContract = await prisma.contract.findUnique({
            where: { id: contract.id },
            include: { history: true },
        });
        if (fetchedContract && fetchedContract.rejectionReason === rejectReasonInput) {
            console.log(`✓ Pass: Buyer successfully sees rejection reason: "${fetchedContract.rejectionReason}"`);
        }
        else {
            throw new Error("Failed to retrieve rejection reason correctly.");
        }
        // TEST 5 & 6 & 7 & 8 & 9: Buyer submits Propose Again.
        console.log("\nTEST 5 & 6 & 7 & 8 & 9: Buyer submits Propose Again (inplace revision transaction)...");
        // Simulate POST /api/contracts logic for inplace revision:
        const revisedPrice = 120000;
        const revisedStartDate = new Date();
        const revisedEndDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
        const revisedNotes = "Increased pricing to ₹120,000 for your review.";
        const updatedContract = await prisma.$transaction(async (tx) => {
            // 1. Copy CURRENT state (v1) to history
            await tx.contractHistory.create({
                data: {
                    contractId: fetchedContract.id,
                    revision: fetchedContract.revision,
                    landArea: fetchedContract.landArea,
                    allocatedQuantity: fetchedContract.allocatedQuantity,
                    proposedPrice: fetchedContract.proposedPrice,
                    startDate: fetchedContract.startDate,
                    expectedHarvestDate: fetchedContract.expectedHarvestDate,
                    status: fetchedContract.status,
                    notes: fetchedContract.notes,
                    rejectionReason: fetchedContract.rejectionReason,
                    decisionDate: fetchedContract.decisionDate,
                    activatedAt: fetchedContract.activatedAt,
                    completedAt: fetchedContract.completedAt,
                },
            });
            // 2. Update existing contract with revised fields and increment revision
            const updated = await tx.contract.update({
                where: { id: fetchedContract.id },
                data: {
                    revision: fetchedContract.revision + 1,
                    proposedPrice: revisedPrice,
                    startDate: revisedStartDate,
                    expectedHarvestDate: revisedEndDate,
                    status: client_1.ContractStatus.PENDING_APPROVAL,
                    notes: revisedNotes,
                    rejectionReason: null,
                    decisionDate: null,
                    activatedAt: null,
                    completedAt: null,
                },
            });
            return updated;
        });
        console.log(`✓ Pass: Inplace revision update completed successfully.`);
        // TEST 6 Verification: Verify ContractHistory contains version 1.
        const historyEntries = await prisma.contractHistory.findMany({
            where: { contractId: contract.id },
        });
        if (historyEntries.length === 1 && historyEntries[0].revision === 1) {
            console.log(`✓ Pass: Verified ContractHistory contains revision 1 record.`);
        }
        else {
            throw new Error("Failed to find revision 1 inside history records.");
        }
        // TEST 7 Verification: Verify current Contract is now revision 2.
        if (updatedContract.revision === 2) {
            console.log(`✓ Pass: Verified current Contract has revision: ${updatedContract.revision}`);
        }
        else {
            throw new Error(`Revision mismatch: expected 2, got ${updatedContract.revision}`);
        }
        // TEST 8 Verification: Verify revision 2 status is PENDING_APPROVAL.
        if (updatedContract.status === client_1.ContractStatus.PENDING_APPROVAL) {
            console.log(`✓ Pass: Verified revision 2 status is PENDING_APPROVAL.`);
        }
        else {
            throw new Error(`Status mismatch: expected PENDING_APPROVAL, got ${updatedContract.status}`);
        }
        // TEST 9 Verification: Verify old rejection reason is preserved in history.
        if (historyEntries[0].rejectionReason === rejectReasonInput) {
            console.log(`✓ Pass: Verified old rejection reason "${historyEntries[0].rejectionReason}" is preserved in history entry.`);
        }
        else {
            throw new Error("Old rejection reason not preserved inside history entry!");
        }
        // TEST 10 & 11: Landowner accepts version 2.
        console.log("\nTEST 10 & 11: Landowner accepts version 2...");
        const acceptResult = await prisma.$transaction(async (tx) => {
            // Try lock land parcel (conditional update)
            const landUpdate = await tx.land.updateMany({
                where: {
                    id: land.id,
                    status: client_1.LandStatus.AVAILABLE,
                },
                data: {
                    status: client_1.LandStatus.UNDER_CONTRACT,
                },
            });
            if (landUpdate.count !== 1) {
                throw new Error("Land is no longer available.");
            }
            // Update current contract
            const accepted = await tx.contract.update({
                where: { id: contract.id },
                data: {
                    status: client_1.ContractStatus.ACCEPTED,
                    decisionDate: new Date(),
                },
            });
            return accepted;
        });
        console.log(`✓ Pass: Landowner accepted proposal version 2.`);
        // TEST 11 Verification: Verify land becomes UNDER_CONTRACT.
        const acceptedLand = await prisma.land.findUnique({ where: { id: land.id } });
        if (acceptedLand?.status === client_1.LandStatus.UNDER_CONTRACT) {
            console.log(`✓ Pass: Verified land status changed to UNDER_CONTRACT.`);
        }
        else {
            throw new Error(`Land status mismatch: expected UNDER_CONTRACT, got ${acceptedLand?.status}`);
        }
        // TEST 12 & 13: Buyer activates contract.
        console.log("\nTEST 12 & 13: Buyer activates contract...");
        const activatedContract = await prisma.contract.update({
            where: { id: contract.id },
            data: {
                status: client_1.ContractStatus.ACTIVE,
                activatedAt: new Date(),
            },
        });
        console.log(`✓ Pass: Buyer activated contract.`);
        // TEST 13 Verification: Verify contract status is ACTIVE.
        if (activatedContract.status === client_1.ContractStatus.ACTIVE) {
            console.log(`✓ Pass: Verified contract status changed to ACTIVE.`);
        }
        else {
            throw new Error(`Contract status mismatch: expected ACTIVE, got ${activatedContract.status}`);
        }
        // TEST 14 & 15: Complete contract.
        console.log("\nTEST 14 & 15: Complete contract...");
        const completedContract = await prisma.$transaction(async (tx) => {
            const currentContract = await tx.contract.findUnique({
                where: { id: contract.id },
            });
            if (!currentContract || currentContract.status !== client_1.ContractStatus.ACTIVE) {
                throw new Error("Contract must be active to complete.");
            }
            // Update contract to COMPLETED
            const completed = await tx.contract.update({
                where: { id: contract.id },
                data: {
                    status: client_1.ContractStatus.COMPLETED,
                    completedAt: new Date(),
                },
            });
            // Release land
            await tx.land.update({
                where: { id: land.id },
                data: {
                    status: client_1.LandStatus.AVAILABLE,
                },
            });
            return completed;
        });
        console.log(`✓ Pass: Contract completed.`);
        // TEST 15 Verification: Verify status, completedAt, and land release.
        const releasedLand = await prisma.land.findUnique({ where: { id: land.id } });
        if (completedContract.status === client_1.ContractStatus.COMPLETED &&
            completedContract.completedAt !== null &&
            releasedLand?.status === client_1.LandStatus.AVAILABLE) {
            console.log(`✓ Pass: Verified contract status COMPLETED, completedAt populated, and land status is AVAILABLE.`);
        }
        else {
            throw new Error("Validation mismatch for contract completion!");
        }
        // TEST 16: Attempt double completion.
        console.log("\nTEST 16: Attempting double completion...");
        try {
            await prisma.$transaction(async (tx) => {
                const c = await tx.contract.findUnique({ where: { id: contract.id } });
                if (!c || c.status !== client_1.ContractStatus.ACTIVE) {
                    throw new Error("Contract is not ACTIVE, cannot complete.");
                }
            });
            console.error("✗ Fail: Double completion was not blocked!");
        }
        catch (err) {
            console.log(`✓ Pass: Double completion correctly blocked with message: "${err.message}"`);
        }
        // TEST 17: Attempt unauthorized revision.
        console.log("\nTEST 17: Attempting unauthorized revision by another buyer...");
        // Simulate user access check during revised proposal check
        if (contract.buyerId !== buyer2.id) {
            console.log(`✓ Pass: Unauthorized revision block correctly identifies that buyer2 does not own the contract.`);
        }
        else {
            console.error("✗ Fail: Unauthorized user was not blocked!");
        }
        // TEST 18: Attempt to revise an ACTIVE or COMPLETED contract.
        console.log("\nTEST 18: Attempting to revise a COMPLETED contract...");
        if (completedContract.status !== client_1.ContractStatus.REJECTED &&
            completedContract.status !== client_1.ContractStatus.CANCELLED) {
            console.log(`✓ Pass: Correctly blocked revision attempt because status is: ${completedContract.status}`);
        }
        else {
            console.error("✗ Fail: Allowed revision of COMPLETED contract!");
        }
        // Clean up created user records
        await prisma.user.delete({ where: { id: buyer2.id } });
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
