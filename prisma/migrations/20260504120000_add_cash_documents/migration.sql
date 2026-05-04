-- CreateTable
CREATE TABLE "CashDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT NOT NULL,
    "counterpartyId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CashDocument_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CashDocument_counterpartyId_idx" ON "CashDocument"("counterpartyId");

-- CreateIndex
CREATE INDEX "CashDocument_date_idx" ON "CashDocument"("date");

-- CreateIndex
CREATE INDEX "CashDocument_type_idx" ON "CashDocument"("type");

-- CreateIndex
CREATE INDEX "CashDocument_subtype_idx" ON "CashDocument"("subtype");
