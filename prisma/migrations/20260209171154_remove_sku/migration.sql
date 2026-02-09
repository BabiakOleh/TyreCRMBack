/*
  Warnings:

  - You are about to drop the column `sku` on the `Product` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_Product" ("autoSubcategory", "brand", "categoryId", "createdAt", "id", "model", "name", "tireBrandId", "tireIsRunFlat", "tireIsXL", "tireLoadIndexId", "tireModelId", "tireSize", "tireSpeedIndexId", "unit", "updatedAt") SELECT "autoSubcategory", "brand", "categoryId", "createdAt", "id", "model", "name", "tireBrandId", "tireIsRunFlat", "tireIsXL", "tireLoadIndexId", "tireModelId", "tireSize", "tireSpeedIndexId", "unit", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
