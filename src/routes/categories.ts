import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = Router();

const createSchema = z.object({
  name: z.string().min(2).max(80)
});

const ALLOWED_NAMES = ["Шини", "Автотовари"];

router.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });
  res.json(categories);
});

router.post("/", async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: parsed.error.flatten()
    });
  }

  const normalized = parsed.data.name.trim();
  if (!ALLOWED_NAMES.includes(normalized)) {
    return res.status(400).json({ error: "Unsupported category" });
  }

  try {
    const category = await prisma.category.create({
      data: { name: normalized }
    });
    res.status(201).json(category);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Category already exists" });
    }
    next(err);
  }
});

export default router;
