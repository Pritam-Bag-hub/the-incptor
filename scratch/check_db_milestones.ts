import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function check() {
  const contracts = await prisma.contract.findMany({
    include: {
      milestones: true,
      crop: true
    }
  });

  console.log(`Found ${contracts.length} contracts.`);
  for (const c of contracts) {
    console.log(`ID: ${c.id}, Status: ${c.status}, Crop: ${c.crop?.name}, Milestones Count: ${c.milestones.length}`);
  }
}

check();
