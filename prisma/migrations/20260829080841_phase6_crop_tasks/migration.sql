-- CreateTable
CREATE TABLE "ContractTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "plannedStart" DATETIME,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "estimatedWorkHours" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractTask_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractTask_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ContractMilestone" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ContractTask_contractId_idx" ON "ContractTask"("contractId");

-- CreateIndex
CREATE INDEX "ContractTask_milestoneId_idx" ON "ContractTask"("milestoneId");

-- CreateIndex
CREATE INDEX "ContractTask_status_idx" ON "ContractTask"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContractTask_milestoneId_sequence_key" ON "ContractTask"("milestoneId", "sequence");
