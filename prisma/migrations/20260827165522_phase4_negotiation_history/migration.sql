-- CreateTable
CREATE TABLE "ContractHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "landArea" REAL NOT NULL,
    "allocatedQuantity" REAL NOT NULL,
    "proposedPrice" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "expectedHarvestDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "decisionDate" DATETIME,
    "activatedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractHistory_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "demandId" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "landownerId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "landArea" REAL NOT NULL,
    "allocatedQuantity" REAL NOT NULL,
    "proposedPrice" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "expectedHarvestDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "notes" TEXT,
    "rejectionReason" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "decisionDate" DATETIME,
    "activatedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "BuyerDemand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contract_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contract_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contract_landownerId_fkey" FOREIGN KEY ("landownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contract_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("activatedAt", "allocatedQuantity", "buyerId", "completedAt", "createdAt", "cropId", "decisionDate", "demandId", "expectedHarvestDate", "id", "landArea", "landId", "landownerId", "notes", "proposedPrice", "startDate", "status", "updatedAt") SELECT "activatedAt", "allocatedQuantity", "buyerId", "completedAt", "createdAt", "cropId", "decisionDate", "demandId", "expectedHarvestDate", "id", "landArea", "landId", "landownerId", "notes", "proposedPrice", "startDate", "status", "updatedAt" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE INDEX "Contract_demandId_idx" ON "Contract"("demandId");
CREATE INDEX "Contract_landId_idx" ON "Contract"("landId");
CREATE INDEX "Contract_buyerId_idx" ON "Contract"("buyerId");
CREATE INDEX "Contract_landownerId_idx" ON "Contract"("landownerId");
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE UNIQUE INDEX "Contract_demandId_landId_key" ON "Contract"("demandId", "landId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ContractHistory_contractId_idx" ON "ContractHistory"("contractId");
