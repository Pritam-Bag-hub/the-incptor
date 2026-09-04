import { db as prisma } from "../../src/lib/db";

export async function runPrismaModelTests() {
  console.log("==================================================");
  console.log("STARTING PRISMA SCHEMA & DATA MODEL VERIFICATION");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    assert(prisma.user !== undefined, "Prisma Client exposes User model");
    assert(prisma.land !== undefined, "Prisma Client exposes Land model");
    assert(prisma.buyerDemand !== undefined, "Prisma Client exposes BuyerDemand model");
    assert(prisma.contract !== undefined, "Prisma Client exposes Contract model");
    assert(prisma.contractFinancialAllocation !== undefined, "Prisma Client exposes ContractFinancialAllocation model");
    assert(prisma.contractYield !== undefined, "Prisma Client exposes ContractYield model");
    assert(prisma.harvestReceipt !== undefined, "Prisma Client exposes HarvestReceipt model");
    assert(prisma.produceInspection !== undefined, "Prisma Client exposes ProduceInspection model");
    assert(prisma.vehicle !== undefined, "Prisma Client exposes Vehicle model");
    assert(prisma.shipment !== undefined, "Prisma Client exposes Shipment model");

    const userCount = await prisma.user.count();
    assert(userCount >= 0, `Database connection active (User count: ${userCount})`);
  } catch (err: any) {
    console.error("Prisma Model Test Error:", err);
    failed++;
  }

  console.log(`Prisma Model Suite Complete: ${passed} PASSED, ${failed} FAILED\n`);
  return { passed, failed };
}

if (require.main === module) {
  runPrismaModelTests()
    .then(({ failed }) => {
      if (failed > 0) process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
