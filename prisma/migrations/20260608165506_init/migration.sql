-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('PURCHASE', 'SALE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "CashDocumentType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "CashDocumentSubtype" AS ENUM ('SUPPLIER_PAYMENT', 'OTHER_EXPENSE', 'CUSTOMER_PAYMENT', 'OTHER_INCOME');

-- CreateEnum
CREATE TYPE "CounterpartyType" AS ENUM ('CUSTOMER', 'SUPPLIER');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitId" TEXT,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TireProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "speedIndexId" TEXT NOT NULL,
    "loadIndexId" TEXT NOT NULL,
    "isXL" BOOLEAN NOT NULL DEFAULT false,
    "isRunFlat" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TireProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoSubcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TireBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TireBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TireModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TireModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TireSpeedIndex" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxKph" INTEGER NOT NULL,

    CONSTRAINT "TireSpeedIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TireLoadIndex" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TireLoadIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counterparty" (
    "id" TEXT NOT NULL,
    "type" "CounterpartyType" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Counterparty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT,
    "type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "counterpartyId" TEXT,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "id" TEXT NOT NULL,
    "type" "OrderType" NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashDocument" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "CashDocumentType" NOT NULL,
    "subtype" "CashDocumentSubtype" NOT NULL,
    "counterpartyId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TireProduct_productId_key" ON "TireProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AutoProduct_productId_key" ON "AutoProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AutoSubcategory_name_key" ON "AutoSubcategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TireBrand_name_key" ON "TireBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TireModel_name_brandId_key" ON "TireModel"("name", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "TireSpeedIndex_code_key" ON "TireSpeedIndex"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TireLoadIndex_code_key" ON "TireLoadIndex"("code");

-- CreateIndex
CREATE INDEX "Counterparty_type_isActive_idx" ON "Counterparty"("type", "isActive");

-- CreateIndex
CREATE INDEX "Counterparty_name_idx" ON "Counterparty"("name");

-- CreateIndex
CREATE INDEX "Counterparty_phone_idx" ON "Counterparty"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Order_documentNumber_key" ON "Order"("documentNumber");

-- CreateIndex
CREATE INDEX "Order_counterpartyId_idx" ON "Order"("counterpartyId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_type_key" ON "DocumentSequence"("type");

-- CreateIndex
CREATE INDEX "CashDocument_counterpartyId_idx" ON "CashDocument"("counterpartyId");

-- CreateIndex
CREATE INDEX "CashDocument_date_idx" ON "CashDocument"("date");

-- CreateIndex
CREATE INDEX "CashDocument_type_idx" ON "CashDocument"("type");

-- CreateIndex
CREATE INDEX "CashDocument_subtype_idx" ON "CashDocument"("subtype");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireProduct" ADD CONSTRAINT "TireProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireProduct" ADD CONSTRAINT "TireProduct_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "TireBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireProduct" ADD CONSTRAINT "TireProduct_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "TireModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireProduct" ADD CONSTRAINT "TireProduct_speedIndexId_fkey" FOREIGN KEY ("speedIndexId") REFERENCES "TireSpeedIndex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireProduct" ADD CONSTRAINT "TireProduct_loadIndexId_fkey" FOREIGN KEY ("loadIndexId") REFERENCES "TireLoadIndex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoProduct" ADD CONSTRAINT "AutoProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoProduct" ADD CONSTRAINT "AutoProduct_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "AutoSubcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireModel" ADD CONSTRAINT "TireModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "TireBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDocument" ADD CONSTRAINT "CashDocument_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
