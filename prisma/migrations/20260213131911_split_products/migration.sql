/*
  Warnings:

  - You are about to drop the column `autoSubcategory` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `brand` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tireBrandId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tireIsRunFlat` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tireIsXL` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tireLoadIndexId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tireModelId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tireSize` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tireSpeedIndexId` on the `Product` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "TireProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "speedIndexId" TEXT NOT NULL,
    "loadIndexId" TEXT NOT NULL,
    "isXL" BOOLEAN NOT NULL DEFAULT false,
    "isRunFlat" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TireProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TireProduct_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "TireBrand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TireProduct_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "TireModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TireProduct_speedIndexId_fkey" FOREIGN KEY ("speedIndexId") REFERENCES "TireSpeedIndex" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TireProduct_loadIndexId_fkey" FOREIGN KEY ("loadIndexId") REFERENCES "TireLoadIndex" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutoProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutoProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "createdAt", "id", "name", "unit", "updatedAt") SELECT "categoryId", "createdAt", "id", "name", "unit", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TireProduct_productId_key" ON "TireProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AutoProduct_productId_key" ON "AutoProduct"("productId");
