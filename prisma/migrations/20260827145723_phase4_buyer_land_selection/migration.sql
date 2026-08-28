-- CreateTable
CREATE TABLE "DemandLandSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "demandId" TEXT NOT NULL,
    "landId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemandLandSelection_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "BuyerDemand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DemandLandSelection_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DemandLandSelection_demandId_idx" ON "DemandLandSelection"("demandId");

-- CreateIndex
CREATE INDEX "DemandLandSelection_landId_idx" ON "DemandLandSelection"("landId");

-- CreateIndex
CREATE UNIQUE INDEX "DemandLandSelection_demandId_landId_key" ON "DemandLandSelection"("demandId", "landId");
