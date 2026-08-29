import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: "c8ee59f1-d794-4e66-b7ea-8c8deac22122" },
      include: {
        milestones: {
          orderBy: { sequence: "asc" },
        },
      },
    });
    console.log("Success! Contract found and milestones loaded:", contract?.milestones.length);
  } catch (error) {
    console.error("Prisma syntax failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
