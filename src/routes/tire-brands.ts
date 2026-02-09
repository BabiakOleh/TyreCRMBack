import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = Router();

const createSchema = z.object({
  name: z.string().min(2).max(80)
});

router.get("/", async (_req, res) => {
  const brands = await prisma.tireBrand.findMany({
    include: { models: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" }
  });
  res.json(brands);
});

router.post("/", async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
  }

  try {
    const brand = await prisma.tireBrand.create({
      data: { name: parsed.data.name.trim() }
    });
    res.status(201).json(brand);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Brand already exists" });
    }
    next(err);
  }
});

export default router;
