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
  tireBrandName: z.string().min(2).max(80).optional(),
  tireModelName: z.string().min(1).max(120).optional(),
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
        (!parsed.data.tireBrandId && !parsed.data.tireBrandName) ||
        (!parsed.data.tireModelId && !parsed.data.tireModelName)
      ) {
        return res.status(400).json({ error: "Missing tire fields" });
      }

      const [speedIndex, loadIndex] = await Promise.all([
        prisma.tireSpeedIndex.findUnique({ where: { id: parsed.data.tireSpeedIndexId } }),
        prisma.tireLoadIndex.findUnique({ where: { id: parsed.data.tireLoadIndexId } })
      ]);

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

    const product = await prisma.$transaction(async (tx) => {
      if (isTire) {
        let brand = null;
        if (parsed.data.tireBrandId) {
          brand = await tx.tireBrand.findUnique({
            where: { id: parsed.data.tireBrandId }
          });
        } else if (parsed.data.tireBrandName) {
          brand = await tx.tireBrand.upsert({
            where: { name: parsed.data.tireBrandName.trim() },
            update: {},
            create: { name: parsed.data.tireBrandName.trim() }
          });
        }

        if (!brand) {
          throw new Error("Invalid brand");
        }

        let model = null;
        if (parsed.data.tireModelId) {
          model = await tx.tireModel.findUnique({
            where: { id: parsed.data.tireModelId }
          });
        } else if (parsed.data.tireModelName) {
          model = await tx.tireModel.upsert({
            where: {
              name_brandId: {
                name: parsed.data.tireModelName.trim(),
                brandId: brand.id
              }
            },
            update: {},
            create: {
              name: parsed.data.tireModelName.trim(),
              brandId: brand.id
            }
          });
        }

        if (!model || model.brandId !== brand.id) {
          throw new Error("Invalid brand/model");
        }

        parsed.data.tireBrandId = brand.id;
        parsed.data.tireModelId = model.id;
        parsed.data.brand = brand.name;
        parsed.data.model = model.name;
      }

      return tx.product.create({
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
        },
        include: {
          category: true,
          tireBrand: true,
          tireModel: true,
          tireSpeedIndex: true,
          tireLoadIndex: true
        }
      });
    });

    res.status(201).json(product);
  } catch (err: any) {
    if (err?.message === "Invalid brand" || err?.message === "Invalid brand/model") {
      return res.status(400).json({ error: err.message });
    }
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Product already exists" });
    }
    next(err);
  }
});

export default router;
