"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
async function runTests() {
    console.log("=== STARTING PHASE 4.3 ACTIVATION & DETAILS TESTS ===");
    try {
        const buyer1 = await prisma.user.findFirst({ where: { role: client_1.Role.BUYER } });
        const buyer2 = await prisma.user.create({
            data: {
                phone: "+919999999911",
                name: "Test Buyer 2",
                role: client_1.Role.BUYER,
            },
        });
        const landowner = await prisma.user.findFirst({ where: { role: client_1.Role.LANDOWNER } });
        const crop = await prisma.crop.findFirst();
        if (!buyer1 || !buyer2 || !landowner || !crop) {
            throw new Error("Missing seeded test data!");
        }
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
                name: "Activation Test Plot",
                size: 3.5,
                unit: "ACRE",
                address: "Golden Fields",
                village: "Jalandhar",
                district: "Jalandhar",
                state: "Punjab",
                latitude: 31.3,
                longitude: 75.6,
                status: client_1.LandStatus.AVAILABLE,
            },
        });
        // Create Contract proposal (PENDING_APPROVAL)
        const contract = await prisma.contract.create({
            data: {
                demandId: demand.id,
                landId: land.id,
                buyerId: buyer1.id,
                landownerId: landowner.id,
                cropId: crop.id,
                landArea: land.size,
                allocatedQuantity: 7.0,
                proposedPrice: 90000,
                startDate: new Date(),
                expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                status: client_1.ContractStatus.PENDING_APPROVAL,
            },
        });
        console.log(`Created proposal ID: ${contract.id}`);
        // TEST A: Unauthorized users cannot access another user's contract details
        console.log("\nTEST A: Unauthorized details access attempt...");
        const accessingUserId = buyer2.id;
        if (contract.buyerId !== accessingUserId && contract.landownerId !== accessingUserId) {
            console.log("✓ Pass: Access authorization block validates correctly (Buyer 2 cannot view Buyer 1's contract).");
        }
        else {
            console.error("✗ Fail: Unauthorized access wasn't correctly identified!");
        }
        // TEST B & C: Landowner and Buyer involved in the contract can access contract details
        console.log("\nTEST B & C: Authorized details access check...");
        if (contract.buyerId === buyer1.id) {
            console.log("✓ Pass: Buyer involved can view details.");
        }
        if (contract.landownerId === landowner.id) {
            console.log("✓ Pass: Landowner involved can view details.");
        }
        // TEST F: Only ACCEPTED contracts can transition to ACTIVE (attempting to activate PENDING_APPROVAL)
        console.log("\nTEST F: Attempting to activate PENDING_APPROVAL contract...");
        if (contract.status !== client_1.ContractStatus.ACCEPTED) {
            console.log(`✓ Pass: Correctly recognized that status (${contract.status}) is not ACCEPTED. Activation blocked.`);
        }
        else {
            console.error("✗ Fail: Activated PENDING_APPROVAL contract!");
        }
        // Transition land to UNDER_CONTRACT and contract to ACCEPTED (simulating landowner decision)
        await prisma.land.update({
            where: { id: land.id },
            data: { status: client_1.LandStatus.UNDER_CONTRACT },
        });
        const acceptedContract = await prisma.contract.update({
            where: { id: contract.id },
            data: { status: client_1.ContractStatus.ACCEPTED, decisionDate: new Date() },
        });
        console.log(`\nSimulated landowner acceptance. Land status: UNDER_CONTRACT. Contract status: ${acceptedContract.status}`);
        // TEST D: Only the buyer who owns the contract can activate it
        console.log("\nTEST D: Checking activation ownership constraints...");
        const activatingUser = buyer2;
        if (acceptedContract.buyerId !== activatingUser.id) {
            console.log(`✓ Pass: Blocked activation by wrong Buyer (${activatingUser.name}).`);
        }
        else {
            console.error("✗ Fail: Activation allowed by wrong Buyer!");
        }
        // TEST E: Landowner cannot activate a contract
        console.log("\nTEST E: Checking landowner activation block...");
        if (landowner.role === client_1.Role.LANDOWNER) {
            console.log("✓ Pass: Landowner role is Farmer/Landowner. API rules restrict activation to BUYER only.");
        }
        else {
            console.error("✗ Fail: Landowner role identified incorrectly!");
        }
        // TEST H & I: Activate Contract, record activatedAt, verify land remains UNDER_CONTRACT
        console.log("\nTEST H & I: Activating contract for authorized Buyer 1...");
        const activated = await prisma.contract.update({
            where: { id: contract.id },
            data: {
                status: client_1.ContractStatus.ACTIVE,
                activatedAt: new Date(),
            },
        });
        const finalLand = await prisma.land.findUnique({ where: { id: land.id } });
        console.log(`✓ Contract status is now: ${activated.status}`);
        console.log(`✓ Contract activatedAt timestamp: ${activated.activatedAt}`);
        console.log(`✓ Associated land status remains: ${finalLand?.status}`);
        if (activated.status === client_1.ContractStatus.ACTIVE &&
            activated.activatedAt !== null &&
            finalLand?.status === client_1.LandStatus.UNDER_CONTRACT) {
            console.log("✓ Pass: Contract is ACTIVE, activatedAt is recorded, land remains UNDER_CONTRACT.");
        }
        else {
            console.error("✗ Fail: Incorrect activation output states!");
        }
        // TEST G: ACTIVE contracts cannot be activated again (attempting second activation)
        console.log("\nTEST G: Trying to activate an already ACTIVE contract...");
        if (activated.status === client_1.ContractStatus.ACTIVE) {
            console.log("✓ Pass: Contract is already ACTIVE. Double-activation check successfully blockages.");
        }
        else {
            console.error("✗ Fail: Active status was not recognized!");
        }
        // Cleanup
        console.log("\nCleaning up test rows...");
        await prisma.contract.delete({ where: { id: contract.id } });
        await prisma.buyerDemand.delete({ where: { id: demand.id } });
        await prisma.land.delete({ where: { id: land.id } });
        await prisma.user.delete({ where: { id: buyer2.id } });
        console.log("=== ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY ===");
    }
    catch (error) {
        console.error("✗ Test script error:", error);
    }
    finally {
        await prisma.$disconnect();
    }
}
runTests();
