import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { backfillContractMilestones } from "../src/lib/contractHelpers.js";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const contract = await prisma.contract.findFirst({
      where: {
        status: { in: ["ACTIVE", "COMPLETED"] }
      }
    });

    if (!contract) {
      console.log("No active/completed contracts found in the database to test.");
      return;
    }

    console.log("Testing backfill for contract ID:", contract.id);
    const result = await backfillContractMilestones(contract.id);
    console.log("Result length:", result?.length);
  } catch (error) {
    console.error("Error executing helper:", error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
