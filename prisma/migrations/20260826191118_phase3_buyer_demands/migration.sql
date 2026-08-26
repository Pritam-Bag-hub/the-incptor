-- CreateTable
CREATE TABLE "BuyerDemand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "requiredQuantity" REAL NOT NULL,
    "quantityUnit" TEXT NOT NULL,
    "preferredState" TEXT NOT NULL,
    "preferredDistrict" TEXT,
    "preferredLatitude" REAL,
    "preferredLongitude" REAL,
    "searchRadiusKm" REAL,
    "requiredLandArea" REAL,
    "preferredStartDate" DATETIME,
    "expectedHarvestDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerDemand_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuyerDemand_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BuyerDemand_buyerId_idx" ON "BuyerDemand"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerDemand_cropId_idx" ON "BuyerDemand"("cropId");

-- CreateIndex
CREATE INDEX "BuyerDemand_status_idx" ON "BuyerDemand"("status");
