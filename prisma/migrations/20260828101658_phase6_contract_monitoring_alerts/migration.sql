-- CreateTable
CREATE TABLE "ContractAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractAlert_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ContractAlert_contractId_idx" ON "ContractAlert"("contractId");

-- CreateIndex
CREATE INDEX "ContractAlert_type_idx" ON "ContractAlert"("type");

-- CreateIndex
CREATE INDEX "ContractAlert_isResolved_idx" ON "ContractAlert"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "ContractAlert_contractId_type_title_key" ON "ContractAlert"("contractId", "type", "title");
