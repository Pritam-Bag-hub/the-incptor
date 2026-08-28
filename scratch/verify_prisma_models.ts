import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log("Exposes contractFinancialAllocation:", prisma.contractFinancialAllocation !== undefined);
  console.log("Exposes contractYield:", prisma.contractYield !== undefined);
}

verify().catch(console.error);
