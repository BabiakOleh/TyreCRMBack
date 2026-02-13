import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = Router();

const listSchema = z.object({
  type: z.enum(["PURCHASE", "SALE"]).optional()
});

const normalizeEmpty = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const createSchema = z.object({
  type: z.enum(["PURCHASE", "SALE"]),
  documentNumber: z.preprocess(normalizeEmpty, z.string().min(1).max(40).optional()),
  counterpartyId: z.string().min(1),
  orderDate: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        priceCents: z.number().int().nonnegative()
      })
    )
    .min(1)
});

const updateSchema = createSchema;

const generateDocumentNumber = async (tx: typeof prisma, type: "PURCHASE" | "SALE") => {
  const sequence = await tx.documentSequence.upsert({
    where: { type },
    update: { nextNumber: { increment: 1 } },
    create: { type, nextNumber: 2 }
  });
  const current = sequence.nextNumber - 1;
  const prefix = type === "PURCHASE" ? "P" : "S";
  return `${prefix}-${String(current).padStart(6, "0")}`;
};

const buildQuantityMap = (
  items: Array<{ productId: string; quantity: number }>
) => {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
  }
  return map;
};

const getTotalsByProduct = async (
  tx: typeof prisma,
  type: "PURCHASE" | "SALE",
  productIds: string[],
  excludeOrderId?: string
) => {
  const where: {
    productId: { in: string[] };
    order: { type: "PURCHASE" | "SALE"; status: { not: "CANCELLED" } };
    orderId?: { not: string };
  } = {
    productId: { in: productIds },
    order: { type, status: { not: "CANCELLED" } }
  };
  if (excludeOrderId) {
    where.orderId = { not: excludeOrderId };
  }

  const rows = await tx.orderItem.groupBy({
    by: ["productId"],
    where,
    _sum: { quantity: true }
  });

  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.productId, row._sum.quantity ?? 0);
  }
  return totals;
};

const validateStock = async (
  tx: typeof prisma,
  params: {
    type: "PURCHASE" | "SALE";
    productIds: string[];
    newQuantities: Map<string, number>;
    excludeOrderId?: string;
  }
) => {
  const purchased = await getTotalsByProduct(
    tx,
    "PURCHASE",
    params.productIds,
    params.excludeOrderId
  );
  const sold = await getTotalsByProduct(
    tx,
    "SALE",
    params.productIds,
    params.excludeOrderId
  );

  const shortages: Array<{ productId: string; available: number; requested: number }> = [];
  for (const productId of params.productIds) {
    const newQty = params.newQuantities.get(productId) ?? 0;
    const totalPurchased = (purchased.get(productId) ?? 0) + (params.type === "PURCHASE" ? newQty : 0);
    const totalSold = (sold.get(productId) ?? 0) + (params.type === "SALE" ? newQty : 0);
    const available = totalPurchased - totalSold;
    if (available < 0) {
      shortages.push({ productId, available, requested: newQty });
    }
  }

  return shortages;
};

router.get("/", async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
  }

  const where = parsed.data.type ? { type: parsed.data.type } : {};
  const orders = await prisma.order.findMany({
    where,
    include: {
      counterparty: true
    },
    orderBy: { orderDate: "desc" }
  });
  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      counterparty: true,
      items: {
        include: {
          product: {
            include: {
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
            }
          }
        }
      }
    }
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json(order);
});

router.post("/", async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
  }

  try {
    const counterparty = await prisma.counterparty.findUnique({
      where: { id: parsed.data.counterpartyId }
    });
    if (!counterparty) {
      return res.status(400).json({ error: "Invalid counterparty" });
    }
    if (parsed.data.type === "PURCHASE" && counterparty.type !== "SUPPLIER") {
      return res.status(400).json({ error: "Invalid supplier" });
    }
    if (parsed.data.type === "SALE" && counterparty.type !== "CUSTOMER") {
      return res.status(400).json({ error: "Invalid customer" });
    }

    const orderDate = parsed.data.orderDate ? new Date(parsed.data.orderDate) : new Date();
    if (Number.isNaN(orderDate.getTime())) {
      return res.status(400).json({ error: "Invalid order date" });
    }

    const totalCents = parsed.data.items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0
    );

    const order = await prisma.$transaction(async (tx) => {
      const newQuantities = buildQuantityMap(
        parsed.data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      );
      const productIds = Array.from(newQuantities.keys());
      const shortages = await validateStock(tx, {
        type: parsed.data.type,
        productIds,
        newQuantities
      });
      if (shortages.length > 0) {
        return { error: "INSUFFICIENT_STOCK", details: shortages } as const;
      }

      const documentNumber =
        parsed.data.documentNumber ?? (await generateDocumentNumber(tx, parsed.data.type));
      const created = await tx.order.create({
        data: {
          type: parsed.data.type,
          documentNumber,
          orderDate,
          counterpartyId: parsed.data.counterpartyId,
          totalCents
        }
      });

      await tx.orderItem.createMany({
        data: parsed.data.items.map((item) => ({
          orderId: created.id,
          productId: item.productId,
          quantity: item.quantity,
          priceCents: item.priceCents
        }))
      });

      return tx.order.findUnique({
        where: { id: created.id },
        include: { counterparty: true }
      });
    });

    if ("error" in order) {
      return res.status(409).json({ error: "Insufficient stock", details: order.details });
    }
    res.status(201).json(order);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Document number already exists" });
    }
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
  }

  try {
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (existing.type !== parsed.data.type) {
      return res.status(400).json({ error: "Order type mismatch" });
    }

    const counterparty = await prisma.counterparty.findUnique({
      where: { id: parsed.data.counterpartyId }
    });
    if (!counterparty) {
      return res.status(400).json({ error: "Invalid counterparty" });
    }
    if (parsed.data.type === "PURCHASE" && counterparty.type !== "SUPPLIER") {
      return res.status(400).json({ error: "Invalid supplier" });
    }
    if (parsed.data.type === "SALE" && counterparty.type !== "CUSTOMER") {
      return res.status(400).json({ error: "Invalid customer" });
    }

    const orderDate = parsed.data.orderDate ? new Date(parsed.data.orderDate) : new Date();
    if (Number.isNaN(orderDate.getTime())) {
      return res.status(400).json({ error: "Invalid order date" });
    }

    const totalCents = parsed.data.items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0
    );

    const order = await prisma.$transaction(async (tx) => {
      const existingItems = await tx.orderItem.findMany({
        where: { orderId: req.params.id },
        select: { productId: true, quantity: true }
      });

      const newQuantities = buildQuantityMap(
        parsed.data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      );

      const productIds = Array.from(
        new Set([
          ...existingItems.map((item) => item.productId),
          ...Array.from(newQuantities.keys())
        ])
      );

      const shortages = await validateStock(tx, {
        type: parsed.data.type,
        productIds,
        newQuantities,
        excludeOrderId: req.params.id
      });
      if (shortages.length > 0) {
        return { error: "INSUFFICIENT_STOCK", details: shortages } as const;
      }

      const documentNumber =
        parsed.data.documentNumber ??
        existing.documentNumber ??
        (await generateDocumentNumber(tx, parsed.data.type));
      const updated = await tx.order.update({
        where: { id: req.params.id },
        data: {
          documentNumber,
          orderDate,
          counterpartyId: parsed.data.counterpartyId,
          totalCents
        }
      });

      await tx.orderItem.deleteMany({ where: { orderId: updated.id } });
      await tx.orderItem.createMany({
        data: parsed.data.items.map((item) => ({
          orderId: updated.id,
          productId: item.productId,
          quantity: item.quantity,
          priceCents: item.priceCents
        }))
      });

      return tx.order.findUnique({
        where: { id: updated.id },
        include: { counterparty: true }
      });
    });

    if ("error" in order) {
      return res.status(409).json({ error: "Insufficient stock", details: order.details });
    }
    res.json(order);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Document number already exists" });
    }
    next(err);
  }
});

export default router;
