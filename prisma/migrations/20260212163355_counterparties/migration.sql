-- CreateTable
CREATE TABLE "Counterparty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Counterparty_type_isActive_idx" ON "Counterparty"("type", "isActive");

-- CreateIndex
CREATE INDEX "Counterparty_name_idx" ON "Counterparty"("name");

-- CreateIndex
CREATE INDEX "Counterparty_phone_idx" ON "Counterparty"("phone");
