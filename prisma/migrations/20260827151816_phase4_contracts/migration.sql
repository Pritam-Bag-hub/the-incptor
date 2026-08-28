-- CreateTable
CREATE TABLE "Contract" (
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
    "decisionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "BuyerDemand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contract_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contract_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contract_landownerId_fkey" FOREIGN KEY ("landownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contract_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Contract_demandId_idx" ON "Contract"("demandId");

-- CreateIndex
CREATE INDEX "Contract_landId_idx" ON "Contract"("landId");

-- CreateIndex
CREATE INDEX "Contract_buyerId_idx" ON "Contract"("buyerId");

-- CreateIndex
CREATE INDEX "Contract_landownerId_idx" ON "Contract"("landownerId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_demandId_landId_key" ON "Contract"("demandId", "landId");
