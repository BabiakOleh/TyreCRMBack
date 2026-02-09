/*
  Warnings:

  - You are about to drop the column `tireLoadIndex` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tireSpeedIndex` on the `Product` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "TireBrand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TireModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TireModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "TireBrand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TireSpeedIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "maxKph" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "TireLoadIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "maxKg" REAL NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "sku" TEXT,
    "unit" TEXT,
    "tireSize" TEXT,
    "tireSpeedIndexId" TEXT,
    "tireLoadIndexId" TEXT,
    "tireIsXL" BOOLEAN NOT NULL DEFAULT false,
    "tireIsRunFlat" BOOLEAN NOT NULL DEFAULT false,
    "tireBrandId" TEXT,
    "tireModelId" TEXT,
    "autoSubcategory" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_tireSpeedIndexId_fkey" FOREIGN KEY ("tireSpeedIndexId") REFERENCES "TireSpeedIndex" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_tireLoadIndexId_fkey" FOREIGN KEY ("tireLoadIndexId") REFERENCES "TireLoadIndex" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_tireBrandId_fkey" FOREIGN KEY ("tireBrandId") REFERENCES "TireBrand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_tireModelId_fkey" FOREIGN KEY ("tireModelId") REFERENCES "TireModel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("autoSubcategory", "brand", "categoryId", "createdAt", "id", "model", "name", "sku", "tireIsRunFlat", "tireIsXL", "tireSize", "unit", "updatedAt") SELECT "autoSubcategory", "brand", "categoryId", "createdAt", "id", "model", "name", "sku", "tireIsRunFlat", "tireIsXL", "tireSize", "unit", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TireBrand_name_key" ON "TireBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TireModel_name_brandId_key" ON "TireModel"("name", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "TireSpeedIndex_code_key" ON "TireSpeedIndex"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TireLoadIndex_code_key" ON "TireLoadIndex"("code");
