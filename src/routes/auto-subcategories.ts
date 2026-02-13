import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = Router();

const createSchema = z.object({
  name: z.string().min(2).max(80)
});

router.get("/", async (_req, res) => {
  const subcategories = await prisma.autoSubcategory.findMany({
    orderBy: { name: "asc" }
  });
  res.json(subcategories);
});

router.post("/", async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
  }

  try {
    const subcategory = await prisma.autoSubcategory.create({
      data: { name: parsed.data.name.trim() }
    });
    res.status(201).json(subcategory);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Subcategory already exists" });
    }
    next(err);
  }
});

export default router;
