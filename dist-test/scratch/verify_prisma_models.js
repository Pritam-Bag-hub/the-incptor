"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
async function verify() {
    console.log("Exposes contractFinancialAllocation:", prisma.contractFinancialAllocation !== undefined);
    console.log("Exposes contractYield:", prisma.contractYield !== undefined);
}
verify().catch(console.error);
