"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
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
    }
    catch (error) {
        console.error("Prisma syntax failed:", error);
    }
    finally {
        await prisma.$disconnect();
    }
}
check();
