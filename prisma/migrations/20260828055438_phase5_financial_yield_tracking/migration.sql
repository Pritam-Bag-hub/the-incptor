-- CreateTable
CREATE TABLE "ContractFinancialAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "totalContractValue" REAL NOT NULL,
    "landownerAmount" REAL NOT NULL,
    "workforceBudget" REAL NOT NULL,
    "logisticsBudget" REAL NOT NULL,
    "platformFee" REAL NOT NULL,
    "reserveBudget" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractFinancialAllocation_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractYield" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "estimatedQuantity" REAL,
    "actualQuantity" REAL,
    "unit" TEXT NOT NULL,
    "fulfillmentPercentage" REAL,
    "fulfillmentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractYield_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractFinancialAllocation_contractId_key" ON "ContractFinancialAllocation"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractYield_contractId_key" ON "ContractYield"("contractId");
