import { runPrismaModelTests } from "./unit/verify_prisma_models";
import { runRouteOptimizationTests } from "./integration/test_route_optimization";
import { db as prisma } from "../src/lib/db";

async function main() {
  console.log("==================================================");
  console.log("AGRIGROWTH COMPLETE SUITE TEST RUNNER");
  console.log("==================================================\n");

  let totalPassed = 0;
  let totalFailed = 0;

  const res1 = await runPrismaModelTests();
  totalPassed += res1.passed;
  totalFailed += res1.failed;

  const res2 = await runRouteOptimizationTests();
  totalPassed += res2.passed;
  totalFailed += res2.failed;

  console.log("==================================================");
  console.log(`FINAL SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("==================================================");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("Test Suite Runner Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
