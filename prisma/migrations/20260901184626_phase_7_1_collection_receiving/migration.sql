-- CreateTable
CREATE TABLE "CollectionCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "capacityTonnes" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "managerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CollectionCenter_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HarvestReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "yieldId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "receivedByUserId" TEXT NOT NULL,
    "grossWeight" REAL NOT NULL,
    "tareWeight" REAL NOT NULL,
    "netWeight" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "receiptPhotoUrl" TEXT,
    "notes" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HarvestReceipt_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HarvestReceipt_yieldId_fkey" FOREIGN KEY ("yieldId") REFERENCES "ContractYield" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HarvestReceipt_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CollectionCenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HarvestReceipt_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProduceInspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "acceptedWeight" REAL NOT NULL,
    "rejectedWeight" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "moistureContent" REAL,
    "foreignMatterPercentage" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "flagReason" TEXT,
    "samplePhotoUrlsJson" TEXT,
    "inspectorGpsLat" REAL,
    "inspectorGpsLng" REAL,
    "inspectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProduceInspection_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "HarvestReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProduceInspection_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProduceInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionCenter_code_key" ON "CollectionCenter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HarvestReceipt_receiptNumber_key" ON "HarvestReceipt"("receiptNumber");
