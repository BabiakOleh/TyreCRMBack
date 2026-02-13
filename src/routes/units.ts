import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(20)
});

router.get("/", async (_req, res) => {
  const units = await prisma.unit.findMany({
    orderBy: { name: "asc" }
  });
  res.json(units);
});

router.post("/", async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
  }

  try {
    const unit = await prisma.unit.create({
      data: { name: parsed.data.name.trim() }
    });
    res.status(201).json(unit);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Unit already exists" });
    }
    next(err);
  }
});

export default router;
