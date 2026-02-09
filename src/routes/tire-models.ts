import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(120),
  brandId: z.string().min(1)
});

router.post("/", async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
  }

  try {
    const model = await prisma.tireModel.create({
      data: {
        name: parsed.data.name.trim(),
        brandId: parsed.data.brandId
      }
    });
    res.status(201).json(model);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Model already exists for brand" });
    }
    next(err);
  }
});

export default router;
