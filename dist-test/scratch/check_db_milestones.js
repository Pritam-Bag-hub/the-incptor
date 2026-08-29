"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
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
