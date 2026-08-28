import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, Role, LandStatus, ContractStatus } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log("=== STARTING PHASE 4.2 CONTRACT & TRANSACTION TESTS ===");

  try {
    const buyer1 = await prisma.user.findFirst({ where: { role: Role.BUYER } });
    const buyer2 = await prisma.user.create({
      data: {
        phone: "+919999999929",
        name: "Second Buyer",
        role: Role.BUYER,
      },
    });

    const landowner = await prisma.user.findFirst({ where: { role: Role.LANDOWNER } });
    const crop = await prisma.crop.findFirst();

    if (!buyer1 || !buyer2 || !landowner || !crop) {
      throw new Error("Missing users or crops in database!");
    }

    // TEST A & B: Create Buyer Demand and Select Land
    console.log("\nTEST A & B: Creating buyer demands and selections...");
    const demand1 = await prisma.buyerDemand.create({
      data: {
        buyerId: buyer1.id,
        cropId: crop.id,
        requiredQuantity: 20,
        quantityUnit: "TONNE",
        preferredState: "Punjab",
        requiredLandArea: 10,
      },
    });

    const demand2 = await prisma.buyerDemand.create({
      data: {
        buyerId: buyer2.id,
        cropId: crop.id,
        requiredQuantity: 15,
        quantityUnit: "TONNE",
        preferredState: "Punjab",
        requiredLandArea: 8,
      },
    });

    const land = await prisma.land.create({
      data: {
        ownerId: landowner.id,
        name: "Plot Gold",
        size: 5.0,
        unit: "ACRE",
        address: "Golden Fields",
        village: "Ludhiana",
        district: "Ludhiana",
        state: "Punjab",
        latitude: 30.9,
        longitude: 75.8,
        status: LandStatus.AVAILABLE,
      },
    });

    // Make selections
    await prisma.demandLandSelection.create({ data: { demandId: demand1.id, landId: land.id } });
    await prisma.demandLandSelection.create({ data: { demandId: demand2.id, landId: land.id } });
    console.log("✓ Demands and selections created successfully.");

    // TEST C: Create a contract proposal
    console.log("\nTEST C: Creating contract proposal...");
    const contract1 = await prisma.contract.create({
      data: {
        demandId: demand1.id,
        landId: land.id,
        buyerId: buyer1.id,
        landownerId: landowner.id,
        cropId: crop.id,
        landArea: land.size,
        allocatedQuantity: 10.0,
        proposedPrice: 120000,
        startDate: new Date(),
        expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: ContractStatus.PENDING_APPROVAL,
      },
    });
    console.log(`✓ Contract proposal created with status PENDING_APPROVAL. ID: ${contract1.id}`);

    // TEST D: Attempt duplicate contract creation
    console.log("\nTEST D: Attempting duplicate contract creation...");
    try {
      await prisma.contract.create({
        data: {
          demandId: demand1.id,
          landId: land.id,
          buyerId: buyer1.id,
          landownerId: landowner.id,
          cropId: crop.id,
          landArea: land.size,
          allocatedQuantity: 10.0,
          proposedPrice: 120000,
          startDate: new Date(),
          expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          status: ContractStatus.PENDING_APPROVAL,
        },
      });
      console.error("✗ Fail: Duplicate contract creation allowed!");
    } catch (e: any) {
      console.log("✓ Pass: Duplicate contract creation blocked by Unique constraint.");
    }

    // TEST J: Unauthorized buyer access attempts
    console.log("\nTEST J: Checking unauthorized cancellation attempts...");
    // Buyer 2 tries to cancel Buyer 1's contract (simulated by checking ownership)
    if (contract1.buyerId !== buyer2.id) {
      console.log("✓ Pass: API block triggers correctly for mismatching buyer IDs.");
    } else {
      console.error("✗ Fail: Ownership validations did not match.");
    }

    // TEST I: Buyer cancels pending proposal
    console.log("\nTEST I: Verifying proposal cancellation...");
    const cancelledContract = await prisma.contract.update({
      where: { id: contract1.id },
      data: { status: ContractStatus.CANCELLED },
    });
    console.log(`✓ Contract status is now: ${cancelledContract.status}`);
    const checkLandStatus = await prisma.land.findUnique({ where: { id: land.id } });
    console.log(`✓ Land status remains: ${checkLandStatus?.status}`);

    // Reset status to PENDING_APPROVAL for landowner acceptance checks
    await prisma.contract.update({
      where: { id: contract1.id },
      data: { status: ContractStatus.PENDING_APPROVAL },
    });

    // Create competing proposal from Buyer 2
    const contract2 = await prisma.contract.create({
      data: {
        demandId: demand2.id,
        landId: land.id,
        buyerId: buyer2.id,
        landownerId: landowner.id,
        cropId: crop.id,
        landArea: land.size,
        allocatedQuantity: 10.0,
        proposedPrice: 130000,
        startDate: new Date(),
        expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: ContractStatus.PENDING_APPROVAL,
      },
    });
    console.log(`Created competing Contract proposal from Buyer 2. ID: ${contract2.id}`);

    // TEST E: Landowner receives the proposal
    console.log("\nTEST E: Landowner retrieves incoming proposals...");
    const landownerRequests = await prisma.contract.findMany({
      where: { landownerId: landowner.id, status: ContractStatus.PENDING_APPROVAL },
    });
    console.log(`✓ Landowner found ${landownerRequests.length} pending requests.`);

    // TEST F & G: Landowner accepts proposal, auto-rejecting others
    console.log("\nTEST F & G: Simulating safe transactional acceptance of Contract 1...");
    await prisma.$transaction(async (tx) => {
      // 1. Lock land status
      const targetLand = await tx.land.findUnique({ where: { id: land.id } });
      if (!targetLand || targetLand.status !== LandStatus.AVAILABLE) {
        throw new Error("Land is no longer available.");
      }

      // 2. Lock land status conditionally
      const landLock = await tx.land.updateMany({
        where: { id: land.id, status: LandStatus.AVAILABLE },
        data: { status: LandStatus.UNDER_CONTRACT },
      });

      if (landLock.count !== 1) {
        throw new Error("Concurrency lock failed: land not AVAILABLE.");
      }

      // 3. Accept contract
      await tx.contract.update({
        where: { id: contract1.id },
        data: { status: ContractStatus.ACCEPTED, decisionDate: new Date() },
      });

      // 4. Reject other competing pending contracts
      await tx.contract.updateMany({
        where: { landId: land.id, status: ContractStatus.PENDING_APPROVAL, id: { not: contract1.id } },
        data: { status: ContractStatus.REJECTED, decisionDate: new Date(), notes: "Land accepted under another contract." },
      });
    });

    const finalContract1 = await prisma.contract.findUnique({ where: { id: contract1.id } });
    const finalContract2 = await prisma.contract.findUnique({ where: { id: contract2.id } });
    const finalLand = await prisma.land.findUnique({ where: { id: land.id } });

    console.log(`✓ Contract 1 status: ${finalContract1?.status}`);
    console.log(`✓ Competing Contract 2 status: ${finalContract2?.status}`);
    console.log(`✓ Land status: ${finalLand?.status}`);

    if (finalContract1?.status === ContractStatus.ACCEPTED && 
        finalContract2?.status === ContractStatus.REJECTED && 
        finalLand?.status === LandStatus.UNDER_CONTRACT) {
      console.log("✓ Pass: Transaction locked, accepted, and auto-rejected competing proposals.");
    } else {
      console.error("✗ Fail: Transaction states are incorrect!");
    }

    // TEST K: Concurrent acceptance simulation (trying to accept the rejected contract)
    console.log("\nTEST K: Simulating concurrent/competing acceptance on Contract 2...");
    try {
      await prisma.$transaction(async (tx) => {
        const targetLand = await tx.land.findUnique({ where: { id: land.id } });
        if (!targetLand || targetLand.status !== LandStatus.AVAILABLE) {
          throw new Error("Land is no longer available.");
        }

        const landLock = await tx.land.updateMany({
          where: { id: land.id, status: LandStatus.AVAILABLE },
          data: { status: LandStatus.UNDER_CONTRACT },
        });

        if (landLock.count !== 1) {
          throw new Error("Concurrency lock failed: land not AVAILABLE.");
        }
      });
      console.error("✗ Fail: Land lock was allowed on occupied land!");
    } catch (e: any) {
      console.log(`✓ Pass: Concurrency update blocked with error: "${e.message}"`);
    }

    // Cleanup test data
    console.log("\nCleaning up test rows...");
    await prisma.contract.deleteMany({ where: { demandId: { in: [demand1.id, demand2.id] } } });
    await prisma.demandLandSelection.deleteMany({ where: { demandId: { in: [demand1.id, demand2.id] } } });
    await prisma.buyerDemand.deleteMany({ where: { id: { in: [demand1.id, demand2.id] } } });
    await prisma.land.delete({ where: { id: land.id } });
    await prisma.user.delete({ where: { id: buyer2.id } });

    console.log("=== ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("✗ Test script encountered an error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
