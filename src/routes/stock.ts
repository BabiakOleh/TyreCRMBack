import { Router } from "express";
import prisma from "../prisma";

const router = Router();

const toMap = (rows: Array<{ productId: string; _sum: { quantity: number | null } }>) => {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.productId, row._sum.quantity ?? 0);
  }
  return map;
};

router.get("/", async (_req, res) => {
  const [purchases, sales, products] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { type: "PURCHASE", status: { not: "CANCELLED" } } },
      _sum: { quantity: true }
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { type: "SALE", status: { not: "CANCELLED" } } },
      _sum: { quantity: true }
    }),
    prisma.product.findMany({
      include: {
        category: true,
        unit: true,
        tireDetails: {
          include: {
            brand: true,
            model: true,
            speedIndex: true,
            loadIndex: true
          }
        },
        autoDetails: {
          include: {
            subcategory: true
          }
        }
      },
      orderBy: { name: "asc" }
    })
  ]);

  const purchasedMap = toMap(purchases);
  const soldMap = toMap(sales);

  const stock = products.map((product) => ({
    product,
    availableQty: (purchasedMap.get(product.id) ?? 0) - (soldMap.get(product.id) ?? 0)
  }));

  res.json(stock);
});

export default router;
