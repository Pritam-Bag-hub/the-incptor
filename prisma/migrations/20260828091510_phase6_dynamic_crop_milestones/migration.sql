-- CreateTable
CREATE TABLE "CropMilestoneTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cropId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "recommendedDurationDays" INTEGER,
    "durationPercentage" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CropMilestoneTemplate_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "plannedDate" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractMilestone_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CropMilestoneTemplate_cropId_idx" ON "CropMilestoneTemplate"("cropId");

-- CreateIndex
CREATE UNIQUE INDEX "CropMilestoneTemplate_cropId_sequence_key" ON "CropMilestoneTemplate"("cropId", "sequence");

-- CreateIndex
CREATE INDEX "ContractMilestone_contractId_idx" ON "ContractMilestone"("contractId");

-- CreateIndex
CREATE INDEX "ContractMilestone_status_idx" ON "ContractMilestone"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContractMilestone_contractId_sequence_key" ON "ContractMilestone"("contractId", "sequence");
