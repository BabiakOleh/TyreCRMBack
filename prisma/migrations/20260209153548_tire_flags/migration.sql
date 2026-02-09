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
    "tireSpeedIndex" TEXT,
    "tireLoadIndex" TEXT,
    "tireIsXL" BOOLEAN NOT NULL DEFAULT false,
    "tireIsRunFlat" BOOLEAN NOT NULL DEFAULT false,
    "autoSubcategory" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("autoSubcategory", "brand", "categoryId", "createdAt", "id", "model", "name", "sku", "tireLoadIndex", "tireSize", "tireSpeedIndex", "unit", "updatedAt") SELECT "autoSubcategory", "brand", "categoryId", "createdAt", "id", "model", "name", "sku", "tireLoadIndex", "tireSize", "tireSpeedIndex", "unit", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
