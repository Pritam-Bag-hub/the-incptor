"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const contractHelpers_js_1 = require("../src/lib/contractHelpers.js");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
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
        const result = await (0, contractHelpers_js_1.backfillContractMilestones)(contract.id);
        console.log("Result length:", result?.length);
    }
    catch (error) {
        console.error("Error executing helper:", error);
    }
    finally {
        await prisma.$disconnect();
    }
}
check();
