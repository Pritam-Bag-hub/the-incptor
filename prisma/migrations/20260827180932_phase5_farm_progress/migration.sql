-- CreateTable
CREATE TABLE "FarmProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FarmProgress_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FarmProgress_contractId_idx" ON "FarmProgress"("contractId");

-- CreateIndex
CREATE INDEX "FarmProgress_stage_idx" ON "FarmProgress"("stage");
