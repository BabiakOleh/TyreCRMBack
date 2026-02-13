import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = Router();

const listSchema = z.object({
  type: z.enum(["PURCHASE", "SALE"]).optional()
});

const createSchema = z.object({
  type: z.enum(["PURCHASE", "SALE"]),
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
    if (parsed.data.type !== "PURCHASE") {
      return res.status(400).json({ error: "Unsupported order type" });
    }

    const counterparty = await prisma.counterparty.findUnique({
      where: { id: parsed.data.counterpartyId }
    });
    if (!counterparty || counterparty.type !== "SUPPLIER") {
      return res.status(400).json({ error: "Invalid supplier" });
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
      const created = await tx.order.create({
        data: {
          type: parsed.data.type,
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

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
