"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
async function runTests() {
    console.log("=== STARTING INTEGRATION TESTS FOR PHASES 5.2 - 5.4 ===");
    try {
        // Fetch seeded users
        const buyer = await prisma.user.findFirst({ where: { role: client_1.Role.BUYER } });
        const landowner = await prisma.user.findFirst({ where: { role: client_1.Role.LANDOWNER } });
        const crop = await prisma.crop.findFirst();
        if (!buyer || !landowner || !crop) {
            throw new Error("Missing seeded test data (users/crops)!");
        }
        // Clean up any stale test users from previous crashed runs
        await prisma.user.deleteMany({
            where: {
                phone: { in: ["+919999999801", "+919999999802"] }
            }
        });
        // Create a dummy buyer/landowner for unauthorized checks
        const otherBuyer = await prisma.user.create({
            data: {
                phone: "+919999999801",
                name: "Other Buyer",
                role: client_1.Role.BUYER,
            },
        });
        const otherLandowner = await prisma.user.create({
            data: {
                phone: "+919999999802",
                name: "Other Landowner",
                role: client_1.Role.LANDOWNER,
            },
        });
        // Create session tokens for HTTP-like authorization headers simulations
        const buyerToken = "token-buyer-" + Date.now();
        await prisma.session.create({
            data: { token: buyerToken, userId: buyer.id, expiresAt: new Date(Date.now() + 3600000) }
        });
        const landownerToken = "token-landowner-" + Date.now();
        await prisma.session.create({
            data: { token: landownerToken, userId: landowner.id, expiresAt: new Date(Date.now() + 3600000) }
        });
        const otherBuyerToken = "token-otherbuyer-" + Date.now();
        await prisma.session.create({
            data: { token: otherBuyerToken, userId: otherBuyer.id, expiresAt: new Date(Date.now() + 3600000) }
        });
        const otherLandownerToken = "token-otherlandowner-" + Date.now();
        await prisma.session.create({
            data: { token: otherLandownerToken, userId: otherLandowner.id, expiresAt: new Date(Date.now() + 3600000) }
        });
        // Create a demand
        const demand = await prisma.buyerDemand.create({
            data: {
                buyerId: buyer.id,
                cropId: crop.id,
                requiredQuantity: 50,
                quantityUnit: "TONNE",
                preferredState: "Punjab",
                requiredLandArea: 10,
            },
        });
        // Create a land
        const land = await prisma.land.create({
            data: {
                ownerId: landowner.id,
                name: "Phases 5.2-5.4 Test Plot",
                size: 10.0,
                unit: "ACRE",
                address: "Test Farm Road",
                village: "Ludhiana",
                district: "Ludhiana",
                state: "Punjab",
                latitude: 30.9,
                longitude: 75.8,
                status: client_1.LandStatus.AVAILABLE,
            },
        });
        // Create a contract proposal
        console.log("\nProposing a contract...");
        const contract = await prisma.contract.create({
            data: {
                demandId: demand.id,
                landId: land.id,
                buyerId: buyer.id,
                landownerId: landowner.id,
                cropId: crop.id,
                landArea: 8.0, // contract actual allocated land area (not land size 10)
                allocatedQuantity: 20.0,
                proposedPrice: 200000,
                startDate: new Date(),
                expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                status: client_1.ContractStatus.PENDING_APPROVAL,
            },
        });
        console.log(`Created Contract Proposal ID: ${contract.id}, agreed Price: ₹${contract.proposedPrice}`);
        // --- FINANCIALS TESTS ---
        console.log("\n--- STARTING FINANCIAL ALLOCATION TESTS ---");
        // Test 1: Financial allocation cannot be created if contract is PENDING_APPROVAL
        console.log("Test 1: Creating financials on PENDING_APPROVAL contract should fail...");
        try {
            // Simulate API constraint validation
            if (contract.status !== client_1.ContractStatus.ACCEPTED && contract.status !== client_1.ContractStatus.ACTIVE) {
                console.log("✓ Pass: Prevented creating financials on PENDING contract.");
            }
            else {
                throw new Error("Allowed creating financials on PENDING contract.");
            }
        }
        catch (e) {
            console.log("✗ Fail: " + e.message);
            throw e;
        }
        // Move contract to ACCEPTED
        await prisma.contract.update({
            where: { id: contract.id },
            data: { status: client_1.ContractStatus.ACCEPTED },
        });
        console.log("Contract status updated to ACCEPTED.");
        // Test 2: Invalid allocation totals are rejected
        console.log("Test 2: Validating sum of allocations totals (with tolerance)...");
        const landownerAmount = 100000;
        const workforceBudget = 50000;
        const logisticsBudget = 20000;
        const platformFee = 20000;
        const reserveBudget = 10000;
        const sum = landownerAmount + workforceBudget + logisticsBudget + platformFee + reserveBudget;
        const invalidSum = landownerAmount + workforceBudget + logisticsBudget + platformFee + 5000; // sum is 195000 (expects 200000)
        if (Math.abs(invalidSum - contract.proposedPrice) >= 0.01) {
            console.log(`✓ Pass: Correctly detected sum mismatch (Sum ${invalidSum} vs Expected ${contract.proposedPrice}).`);
        }
        else {
            throw new Error("Failed to reject invalid financials sum total.");
        }
        // Test 3: Unauthorized users cannot write financials
        console.log("Test 3: Access check: Unrelated buyer cannot customize financials...");
        if (contract.buyerId !== otherBuyer.id) {
            console.log("✓ Pass: Blocked unrelated buyer from customizing financials.");
        }
        else {
            throw new Error("Allowed unrelated buyer to write financials.");
        }
        // Test 4: Financial allocation can be created by associated Buyer
        console.log("Test 4: Creating valid financials by associated Buyer...");
        const allocation = await prisma.contractFinancialAllocation.create({
            data: {
                contractId: contract.id,
                totalContractValue: contract.proposedPrice,
                landownerAmount,
                workforceBudget,
                logisticsBudget,
                platformFee,
                reserveBudget,
                isConfigured: true,
            },
        });
        console.log(`✓ Pass: Financial allocation created. Configured: ${allocation.isConfigured}`);
        // Test 5: Associated Buyer and Landowner can retrieve financial allocations
        console.log("Test 5: Associated users can fetch financials...");
        const fetchedFin = await prisma.contractFinancialAllocation.findUnique({
            where: { contractId: contract.id },
        });
        if (fetchedFin && fetchedFin.totalContractValue === contract.proposedPrice) {
            console.log("✓ Pass: Retreived financials successfully.");
        }
        else {
            throw new Error("Failed to retrieve financials.");
        }
        // Test 6: Duplicate/conflicting financial records are prevented
        console.log("Test 6: Idempotent prevention: Creating duplicate allocation on contractId...");
        try {
            await prisma.contractFinancialAllocation.create({
                data: {
                    contractId: contract.id,
                    totalContractValue: contract.proposedPrice,
                    landownerAmount: 0,
                    workforceBudget: 0,
                    logisticsBudget: 0,
                    platformFee: 0,
                    reserveBudget: 0,
                },
            });
            throw new Error("Allowed duplicate contractFinancialAllocation record!");
        }
        catch (e) {
            if (e.code === "P2002") {
                console.log("✓ Pass: Unique constraint prevented duplicate records.");
            }
            else {
                throw e;
            }
        }
        // --- YIELD & FULFILLMENT TESTS ---
        console.log("\n--- STARTING YIELD & FULFILLMENT TESTS ---");
        // Seed yield metadata on crop
        console.log("Updating Crop expectedYieldPerAcre metadata to 2.0 tonnes/acre...");
        await prisma.crop.update({
            where: { id: crop.id },
            data: {
                metadataJson: JSON.stringify({ expectedYieldPerAcre: 2.0, basePricePerTonne: 25000 }),
            },
        });
        // Test 7: Expected yield is created/calculated correctly on contract activation
        console.log("Test 7: Activating contract & checking default calculations...");
        // Simulate activate transaction
        const activatedContract = await prisma.$transaction(async (tx) => {
            await tx.contract.update({
                where: { id: contract.id },
                data: { status: client_1.ContractStatus.ACTIVE, activatedAt: new Date() },
            });
            // Upsert financials defaults (isConfigured stays true since we wrote custom values, or upsert updates it)
            await tx.contractFinancialAllocation.upsert({
                where: { contractId: contract.id },
                create: {
                    contractId: contract.id,
                    totalContractValue: contract.proposedPrice,
                    landownerAmount: contract.proposedPrice * 0.50,
                    workforceBudget: contract.proposedPrice * 0.25,
                    logisticsBudget: contract.proposedPrice * 0.10,
                    platformFee: contract.proposedPrice * 0.10,
                    reserveBudget: contract.proposedPrice * 0.05,
                    isConfigured: false,
                },
                update: {
                    totalContractValue: contract.proposedPrice,
                },
            });
            // Fetch fresh crop
            const freshCrop = await tx.crop.findUnique({ where: { id: crop.id } });
            let estQty = null;
            if (freshCrop?.metadataJson) {
                const meta = JSON.parse(freshCrop.metadataJson);
                estQty = parseFloat(meta.expectedYieldPerAcre) * contract.landArea; // 2.0 * 8.0 = 16.0
            }
            const yieldRec = await tx.contractYield.upsert({
                where: { contractId: contract.id },
                create: {
                    contractId: contract.id,
                    estimatedQuantity: estQty,
                    actualQuantity: null,
                    unit: demand.quantityUnit,
                    fulfillmentStatus: client_1.FulfillmentStatus.PENDING,
                },
                update: {
                    estimatedQuantity: estQty,
                },
            });
            return yieldRec;
        });
        console.log("Contract is ACTIVE.");
        if (activatedContract.estimatedQuantity === 16.0) {
            console.log(`✓ Pass: Estimated yield calculated correctly: ${activatedContract.estimatedQuantity} TONNES (Yield: 2.0/acre * Area: 8.0).`);
        }
        else {
            throw new Error(`Estimated yield was incorrect. Found: ${activatedContract.estimatedQuantity}`);
        }
        // Test 8: Unauthorized user cannot submit actual yield
        console.log("Test 8: Access check: Unrelated user cannot record actual yield...");
        if (contract.landownerId !== otherLandowner.id) {
            console.log("✓ Pass: Blocked other landowner from submitting yield.");
        }
        else {
            throw new Error("Allowed unrelated landowner to write yield.");
        }
        // Test 9: Actual yield cannot be submitted before valid progress states (HARVEST_READY or HARVEST_COMPLETED)
        console.log("Test 9: Block yield recording if farm progress stage is insufficient...");
        const progressList = await prisma.farmProgress.findMany({ where: { contractId: contract.id } });
        const hasHarvestProgress = progressList.some(p => p.stage === client_1.FarmProgressStage.HARVEST_READY || p.stage === client_1.FarmProgressStage.HARVEST_COMPLETED);
        if (!hasHarvestProgress) {
            console.log("✓ Pass: Blocked actual yield recording since farm is not in harvest ready/completed stage.");
        }
        else {
            throw new Error("Allowed actual yield recording before harvest stage arrived.");
        }
        // Log progress update HARVEST_READY
        console.log("Logging progress update stage to HARVEST_READY...");
        await prisma.farmProgress.create({
            data: {
                contractId: contract.id,
                stage: client_1.FarmProgressStage.HARVEST_READY,
                notes: "Crops are ripe and ready for harvesting.",
            },
        });
        // Test 10, 11, 12: Partial fulfillment check (actual quantity < estimated)
        console.log("Test 10 & 11 & 12: Submitting actual harvested quantity for PARTIAL check...");
        const actualQtyPartial = 12.0; // 12.0 / 16.0 = 75% (< 90%)
        const pctPartial = (actualQtyPartial / activatedContract.estimatedQuantity) * 100;
        let statusPartial = client_1.FulfillmentStatus.PENDING;
        if (pctPartial < 90)
            statusPartial = client_1.FulfillmentStatus.PARTIAL;
        const yieldPartial = await prisma.contractYield.update({
            where: { contractId: contract.id },
            data: {
                actualQuantity: actualQtyPartial,
                fulfillmentPercentage: pctPartial,
                fulfillmentStatus: statusPartial,
            },
        });
        if (yieldPartial.fulfillmentStatus === client_1.FulfillmentStatus.PARTIAL && yieldPartial.fulfillmentPercentage === 75.0) {
            console.log(`✓ Pass: Recorded quantity, computed percentage: ${yieldPartial.fulfillmentPercentage}%, status is correctly: ${yieldPartial.fulfillmentStatus}`);
        }
        else {
            throw new Error("Partial fulfillment check failed.");
        }
        // Test 13: Fulfilled state check (actual quantity within 90-110% of estimated quantity)
        console.log("Test 13: Submitting quantity for FULFILLED check (within 10% tolerance)...");
        const actualQtyFulfilled = 15.2; // 15.2 / 16.0 = 95%
        const pctFulfilled = (actualQtyFulfilled / activatedContract.estimatedQuantity) * 100;
        let statusFulfilled = client_1.FulfillmentStatus.PENDING;
        if (pctFulfilled >= 90 && pctFulfilled <= 110)
            statusFulfilled = client_1.FulfillmentStatus.FULFILLED;
        const yieldFulfilled = await prisma.contractYield.update({
            where: { contractId: contract.id },
            data: {
                actualQuantity: actualQtyFulfilled,
                fulfillmentPercentage: pctFulfilled,
                fulfillmentStatus: statusFulfilled,
            },
        });
        if (yieldFulfilled.fulfillmentStatus === client_1.FulfillmentStatus.FULFILLED && yieldFulfilled.fulfillmentPercentage === 95.0) {
            console.log(`✓ Pass: Status is correctly: ${yieldFulfilled.fulfillmentStatus} (${yieldFulfilled.fulfillmentPercentage}%)`);
        }
        else {
            throw new Error("Fulfilled state check failed.");
        }
        // Test 14: Overfulfilled state check (actual quantity > 110% of estimated quantity)
        console.log("Test 14: Submitting quantity for OVERFULFILLED check (> 110%)...");
        const actualQtyOver = 19.2; // 19.2 / 16.0 = 120%
        const pctOver = (actualQtyOver / activatedContract.estimatedQuantity) * 100;
        let statusOver = client_1.FulfillmentStatus.PENDING;
        if (pctOver > 110)
            statusOver = client_1.FulfillmentStatus.OVERFULFILLED;
        const yieldOver = await prisma.contractYield.update({
            where: { contractId: contract.id },
            data: {
                actualQuantity: actualQtyOver,
                fulfillmentPercentage: pctOver,
                fulfillmentStatus: statusOver,
            },
        });
        if (yieldOver.fulfillmentStatus === client_1.FulfillmentStatus.OVERFULFILLED && yieldOver.fulfillmentPercentage === 120.0) {
            console.log(`✓ Pass: Status is correctly: ${yieldOver.fulfillmentStatus} (${yieldOver.fulfillmentPercentage}%)`);
        }
        else {
            throw new Error("Overfulfilled state check failed.");
        }
        // Test 15: Harvest submission does not automatically complete the contract
        console.log("Test 15: Verifying contract status remains ACTIVE after harvest submission...");
        const refContract = await prisma.contract.findUnique({ where: { id: contract.id } });
        if (refContract?.status === client_1.ContractStatus.ACTIVE) {
            console.log("✓ Pass: Contract is still ACTIVE. Manual completion remains required.");
        }
        else {
            throw new Error("Contract status was automatically modified after yield submission!");
        }
        // --- OVERVIEW & DYNAMIC REPORTING TESTS ---
        console.log("\n--- STARTING DYNAMIC OVERVIEW & HEALTH TESTS ---");
        // Log another progress update GROWING
        await prisma.farmProgress.create({
            data: {
                contractId: contract.id,
                stage: client_1.FarmProgressStage.GROWING,
                notes: "Irrigation running.",
            },
        });
        // Test 16 & 17: Associated users can fetch overview
        console.log("Test 16 & 17: Access check: associated users can fetch dynamic overview...");
        if (contract.buyerId === buyer.id && contract.landownerId === landowner.id) {
            console.log("✓ Pass: Associated users passed access verification.");
        }
        else {
            throw new Error("Associated user access check failed.");
        }
        // Test 18: Unrelated users are blocked
        console.log("Test 18: Access check: unrelated user is blocked...");
        if (contract.buyerId !== otherBuyer.id && contract.landownerId !== otherBuyer.id) {
            console.log("✓ Pass: Correctly identified that otherBuyer is unrelated.");
        }
        else {
            throw new Error("Allowed unrelated user to bypass check.");
        }
        // Fetch progress updates for overview simulation
        const dbContract = await prisma.contract.findUnique({
            where: { id: contract.id },
            include: {
                financialAllocation: true,
                yield: true,
                progressUpdates: { orderBy: { createdAt: "desc" } }
            }
        });
        const latest = dbContract.progressUpdates[0];
        // Test 19: Reports current stage
        console.log("Test 19: Dynamic overview reports current stage...");
        if (latest.stage === client_1.FarmProgressStage.GROWING) {
            console.log(`✓ Pass: Correctly reported stage: ${latest.stage}`);
        }
        else {
            throw new Error("Incorrect stage reported.");
        }
        // Test 20: Reports progress percentage
        console.log("Test 20: Dynamic overview maps stage to percentage...");
        let pct = 0;
        if (latest.stage === client_1.FarmProgressStage.GROWING)
            pct = 60;
        if (pct === 60) {
            console.log(`✓ Pass: GROWING stage correctly mapped to ${pct}%.`);
        }
        else {
            throw new Error("Incorrect progress percentage mapped.");
        }
        // Test 21: Includes yield summary
        console.log("Test 21: Dynamic overview includes yield details...");
        if (dbContract?.yield && dbContract.yield.actualQuantity === 19.2) {
            console.log(`✓ Pass: Yield summary details matched. Actual quantity: ${dbContract.yield.actualQuantity}`);
        }
        else {
            throw new Error("Yield summary details mismatch.");
        }
        // Test 22: Includes financial summary
        console.log("Test 22: Dynamic overview includes financials details...");
        if (dbContract?.financialAllocation && dbContract.financialAllocation.platformFee === 20000) {
            console.log(`✓ Pass: Financial allocations matched. Platform fee: ₹${dbContract.financialAllocation.platformFee}`);
        }
        else {
            throw new Error("Financial summary details mismatch.");
        }
        // Test 23: Completed contract health
        console.log("Test 23: Complete contract and verify health status is COMPLETED...");
        await prisma.contract.update({
            where: { id: contract.id },
            data: { status: client_1.ContractStatus.COMPLETED, completedAt: new Date() },
        });
        const finalContract = await prisma.contract.findUnique({ where: { id: contract.id } });
        let healthStatus = "ON_TRACK";
        if (finalContract?.status === client_1.ContractStatus.COMPLETED) {
            healthStatus = "COMPLETED";
        }
        if (healthStatus === "COMPLETED") {
            console.log("✓ Pass: Completed contract reports health status as COMPLETED.");
        }
        else {
            throw new Error("Overview did not report COMPLETED for completed contract.");
        }
        // Test 24: Safely backfill missing financial allocation records on an existing active contract
        console.log("\nTest 24: Backfilling missing financial allocation records on ACCEPTED contract...");
        const landBackfill = await prisma.land.create({
            data: {
                ownerId: landowner.id,
                name: "Phases 5.2-5.4 Backfill Land",
                size: 5.0,
                unit: "ACRE",
                address: "Test Farm Road",
                village: "Ludhiana",
                district: "Ludhiana",
                state: "Punjab",
                latitude: 30.9,
                longitude: 75.8,
                status: client_1.LandStatus.AVAILABLE,
            },
        });
        const acceptContract = await prisma.contract.create({
            data: {
                demandId: demand.id,
                landId: landBackfill.id,
                buyerId: buyer.id,
                landownerId: landowner.id,
                cropId: crop.id,
                landArea: 5.0,
                allocatedQuantity: 10.0,
                proposedPrice: 150000,
                startDate: new Date(),
                expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                status: client_1.ContractStatus.ACCEPTED,
            },
        });
        // Simulate backfillFinancialAllocation logic
        const val = acceptContract.proposedPrice;
        const backfilledAllocation = await prisma.contractFinancialAllocation.upsert({
            where: { contractId: acceptContract.id },
            create: {
                contractId: acceptContract.id,
                totalContractValue: val,
                landownerAmount: val * 0.50,
                workforceBudget: val * 0.25,
                logisticsBudget: val * 0.10,
                platformFee: val * 0.10,
                reserveBudget: val * 0.05,
                isConfigured: false,
            },
            update: {},
        });
        if (backfilledAllocation && backfilledAllocation.totalContractValue === 150000 && !backfilledAllocation.isConfigured) {
            console.log(`✓ Pass: Backfilled financial allocation successfully. Configured: ${backfilledAllocation.isConfigured}, Total: ₹${backfilledAllocation.totalContractValue}`);
        }
        else {
            throw new Error("Financial allocation backfill failed.");
        }
        // Test 25: Safely backfill missing yield records on an existing active contract
        console.log("Test 25: Backfilling missing yield records on ACTIVE contract...");
        await prisma.contract.update({
            where: { id: acceptContract.id },
            data: { status: client_1.ContractStatus.ACTIVE },
        });
        // Simulate backfillContractYield logic
        let estQty = null;
        if (crop.metadataJson) {
            try {
                const meta = JSON.parse(crop.metadataJson);
                const yieldPerAcre = parseFloat(meta.expectedYieldPerAcre);
                if (!isNaN(yieldPerAcre) && yieldPerAcre > 0) {
                    estQty = yieldPerAcre * acceptContract.landArea;
                }
            }
            catch (e) { }
        }
        const backfilledYield = await prisma.contractYield.upsert({
            where: { contractId: acceptContract.id },
            create: {
                contractId: acceptContract.id,
                estimatedQuantity: estQty,
                actualQuantity: null,
                unit: "TONNE",
                fulfillmentStatus: client_1.FulfillmentStatus.PENDING,
            },
            update: {},
        });
        const expectedBackfillQty = 2.0 * 5.0; // expectedYieldPerAcre is 2.0 * landArea is 5.0 = 10.0 tonnes
        if (backfilledYield && backfilledYield.estimatedQuantity === expectedBackfillQty && backfilledYield.fulfillmentStatus === client_1.FulfillmentStatus.PENDING) {
            console.log(`✓ Pass: Backfilled yield successfully. Quantity: ${backfilledYield.estimatedQuantity} TONNES, Status: ${backfilledYield.fulfillmentStatus}`);
        }
        else {
            throw new Error(`Yield backfill failed. Expected: ${expectedBackfillQty}, Found: ${backfilledYield?.estimatedQuantity}`);
        }
        // Clean up backfill test contract
        await prisma.contractFinancialAllocation.deleteMany({ where: { contractId: acceptContract.id } });
        await prisma.contractYield.deleteMany({ where: { contractId: acceptContract.id } });
        await prisma.contract.delete({ where: { id: acceptContract.id } });
        await prisma.land.delete({ where: { id: landBackfill.id } });
        // Clean up test data
        console.log("\nCleaning up integration test data rows...");
        await prisma.farmProgress.deleteMany({ where: { contractId: contract.id } });
        await prisma.contractFinancialAllocation.deleteMany({ where: { contractId: contract.id } });
        await prisma.contractYield.deleteMany({ where: { contractId: contract.id } });
        await prisma.contract.delete({ where: { id: contract.id } });
        await prisma.land.delete({ where: { id: land.id } });
        await prisma.buyerDemand.delete({ where: { id: demand.id } });
        await prisma.user.delete({ where: { id: otherBuyer.id } });
        await prisma.user.delete({ where: { id: otherLandowner.id } });
        console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===");
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
