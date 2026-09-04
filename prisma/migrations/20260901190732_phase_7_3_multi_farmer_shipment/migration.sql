-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL DEFAULT 'MEDIUM_LORRY',
    "capacity" REAL NOT NULL,
    "capacityUnit" TEXT NOT NULL DEFAULT 'TONNE',
    "transporterId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "currentLatitude" REAL,
    "currentLongitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentCode" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "demandId" TEXT,
    "vehicleId" TEXT,
    "transporterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalWeight" REAL NOT NULL DEFAULT 0,
    "weightUnit" TEXT NOT NULL DEFAULT 'TONNE',
    "destinationAddress" TEXT NOT NULL,
    "destinationLatitude" REAL NOT NULL,
    "destinationLongitude" REAL NOT NULL,
    "scheduledPickupDate" DATETIME,
    "dispatchedAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shipment_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Shipment_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "BuyerDemand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Shipment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Shipment_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "shippedWeight" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "pickupSequence" INTEGER NOT NULL DEFAULT 1,
    "isPickedUp" BOOLEAN NOT NULL DEFAULT false,
    "pickedUpAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShipmentItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "HarvestReceipt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShipmentItem_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CollectionCenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vehicleNumber_key" ON "Vehicle"("vehicleNumber");

-- CreateIndex
CREATE INDEX "Vehicle_transporterId_idx" ON "Vehicle"("transporterId");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentCode_key" ON "Shipment"("shipmentCode");

-- CreateIndex
CREATE INDEX "Shipment_buyerId_idx" ON "Shipment"("buyerId");

-- CreateIndex
CREATE INDEX "Shipment_vehicleId_idx" ON "Shipment"("vehicleId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentItem_receiptId_idx" ON "ShipmentItem"("receiptId");

-- CreateIndex
CREATE INDEX "ShipmentItem_centerId_idx" ON "ShipmentItem"("centerId");
