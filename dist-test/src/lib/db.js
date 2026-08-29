"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
let db;
if (process.env.NODE_ENV === "production") {
    const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
    exports.db = db = new client_1.PrismaClient({ adapter });
}
else {
    if (!globalForPrisma.prisma) {
        const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
        globalForPrisma.prisma = new client_1.PrismaClient({ adapter });
    }
    exports.db = db = globalForPrisma.prisma;
}
