import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = Router();

const TIRE_CATEGORY = "Шини";
const AUTO_CATEGORY = "Автотовари";

const createSchema = z.object({
  categoryId: z.string().min(1),
  brand: z.string().min(2).max(80),
  model: z.string().min(1).max(120),
  unit: z.string().min(1).max(20).optional(),
  tireSize: z.string().min(2).max(50).optional(),
  tireSpeedIndexId: z.string().min(1).optional(),
  tireLoadIndexId: z.string().min(1).optional(),
  tireBrandId: z.string().min(1).optional(),
  tireModelId: z.string().min(1).optional(),
  tireIsXL: z.boolean().optional(),
  tireIsRunFlat: z.boolean().optional(),
  autoSubcategory: z.string().min(2).max(80).optional()
});

router.get("/", async (_req, res) => {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      tireBrand: true,
      tireModel: true,
      tireSpeedIndex: true,
      tireLoadIndex: true
    },
    orderBy: { name: "asc" }
  });
  res.json(products);
});

router.post("/", async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: parsed.error.flatten()
    });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId }
    });

    if (!category) {
      return res.status(400).json({ error: "Category not found" });
    }

    const isTire = category.name === TIRE_CATEGORY;
    const isAuto = category.name === AUTO_CATEGORY;

    if (!isTire && !isAuto) {
      return res.status(400).json({ error: "Unsupported category" });
    }

    if (isTire) {
      if (
        !parsed.data.tireSize ||
        !parsed.data.tireSpeedIndexId ||
        !parsed.data.tireLoadIndexId ||
        !parsed.data.tireBrandId ||
        !parsed.data.tireModelId
      ) {
        return res.status(400).json({ error: "Missing tire fields" });
      }

      const [brand, model, speedIndex, loadIndex] = await Promise.all([
        prisma.tireBrand.findUnique({ where: { id: parsed.data.tireBrandId } }),
        prisma.tireModel.findUnique({ where: { id: parsed.data.tireModelId } }),
        prisma.tireSpeedIndex.findUnique({ where: { id: parsed.data.tireSpeedIndexId } }),
        prisma.tireLoadIndex.findUnique({ where: { id: parsed.data.tireLoadIndexId } })
      ]);

      if (!brand || !model || model.brandId !== brand.id) {
        return res.status(400).json({ error: "Invalid brand/model" });
      }
      if (!speedIndex || !loadIndex) {
        return res.status(400).json({ error: "Invalid tire indices" });
      }
    }

    if (isAuto) {
      if (!parsed.data.brand.trim() || !parsed.data.model.trim()) {
        return res.status(400).json({ error: "Missing brand/model" });
      }
      if (!parsed.data.autoSubcategory) {
        return res.status(400).json({ error: "Missing auto subcategory" });
      }
    }

    const nameParts = [parsed.data.brand.trim(), parsed.data.model.trim()];
    if (isTire) {
      if (parsed.data.tireIsXL) {
        nameParts.push("XL");
      }
      if (parsed.data.tireIsRunFlat) {
        nameParts.push("RunFlat");
      }
    }

    const product = await prisma.product.create({
      data: {
        name: nameParts.join(" ").trim(),
        brand: parsed.data.brand.trim(),
        model: parsed.data.model.trim(),
        categoryId: parsed.data.categoryId,
        unit: parsed.data.unit?.trim(),
        tireSize: parsed.data.tireSize?.trim(),
        tireSpeedIndexId: parsed.data.tireSpeedIndexId,
        tireLoadIndexId: parsed.data.tireLoadIndexId,
        tireBrandId: parsed.data.tireBrandId,
        tireModelId: parsed.data.tireModelId,
        tireIsXL: Boolean(parsed.data.tireIsXL),
        tireIsRunFlat: Boolean(parsed.data.tireIsRunFlat),
        autoSubcategory: parsed.data.autoSubcategory?.trim()
      }
    });
    res.status(201).json(product);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Product already exists" });
    }
    next(err);
  }
});

export default router;
