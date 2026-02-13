import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = Router();

const TIRE_CATEGORY = "Шини";
const AUTO_CATEGORY = "Автотовари";

const createSchema = z.object({
  categoryId: z.string().min(1),
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
  autoBrand: z.string().min(2).max(80).optional(),
  autoModel: z.string().min(1).max(120).optional(),
  autoSubcategory: z.string().min(2).max(80).optional()
});

const updateSchema = createSchema;

router.get("/", async (_req, res) => {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      tireDetails: {
        include: {
          brand: true,
          model: true,
          speedIndex: true,
          loadIndex: true
        }
      },
      autoDetails: true
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
      if (!parsed.data.autoBrand?.trim() || !parsed.data.autoModel?.trim()) {
        return res.status(400).json({ error: "Missing brand/model" });
      }
      if (!parsed.data.autoSubcategory) {
        return res.status(400).json({ error: "Missing auto subcategory" });
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
        parsed.data.tireBrandName = brand.name;
        parsed.data.tireModelName = model.name;
      }

      const nameParts = isTire
        ? [
            parsed.data.tireBrandName?.trim() ?? "",
            parsed.data.tireModelName?.trim() ?? ""
          ].filter(Boolean)
        : [
            parsed.data.autoBrand?.trim() ?? "",
            parsed.data.autoModel?.trim() ?? ""
          ].filter(Boolean);

      if (isTire) {
        if (parsed.data.tireIsXL) {
          nameParts.push("XL");
        }
        if (parsed.data.tireIsRunFlat) {
          nameParts.push("RunFlat");
        }
      }

      const product = await tx.product.create({
        data: {
          name: nameParts.join(" ").trim(),
          categoryId: parsed.data.categoryId,
          unit: parsed.data.unit?.trim()
        }
      });

      if (isTire) {
        await tx.tireProduct.create({
          data: {
            productId: product.id,
            brandId: parsed.data.tireBrandId!,
            modelId: parsed.data.tireModelId!,
            size: parsed.data.tireSize!,
            speedIndexId: parsed.data.tireSpeedIndexId!,
            loadIndexId: parsed.data.tireLoadIndexId!,
            isXL: Boolean(parsed.data.tireIsXL),
            isRunFlat: Boolean(parsed.data.tireIsRunFlat)
          }
        });
      }

      if (isAuto) {
        await tx.autoProduct.create({
          data: {
            productId: product.id,
            brand: parsed.data.autoBrand!.trim(),
            model: parsed.data.autoModel!.trim(),
            subcategory: parsed.data.autoSubcategory!.trim()
          }
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          tireDetails: {
            include: {
              brand: true,
              model: true,
              speedIndex: true,
              loadIndex: true
            }
          },
          autoDetails: true
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

router.put("/:id", async (req, res, next) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: parsed.error.flatten()
    });
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

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
      if (!parsed.data.autoBrand?.trim() || !parsed.data.autoModel?.trim()) {
        return res.status(400).json({ error: "Missing brand/model" });
      }
      if (!parsed.data.autoSubcategory) {
        return res.status(400).json({ error: "Missing auto subcategory" });
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
        parsed.data.tireBrandName = brand.name;
        parsed.data.tireModelName = model.name;
      }

      const nameParts = isTire
        ? [
            parsed.data.tireBrandName?.trim() ?? "",
            parsed.data.tireModelName?.trim() ?? ""
          ].filter(Boolean)
        : [
            parsed.data.autoBrand?.trim() ?? "",
            parsed.data.autoModel?.trim() ?? ""
          ].filter(Boolean);

      if (isTire) {
        if (parsed.data.tireIsXL) {
          nameParts.push("XL");
        }
        if (parsed.data.tireIsRunFlat) {
          nameParts.push("RunFlat");
        }
      }

      const updatedProduct = await tx.product.update({
        where: { id: req.params.id },
        data: {
          name: nameParts.join(" ").trim(),
          categoryId: parsed.data.categoryId,
          unit: parsed.data.unit?.trim()
        }
      });

      if (isTire) {
        await tx.autoProduct.deleteMany({
          where: { productId: updatedProduct.id }
        });
        await tx.tireProduct.upsert({
          where: { productId: updatedProduct.id },
          update: {
            brandId: parsed.data.tireBrandId!,
            modelId: parsed.data.tireModelId!,
            size: parsed.data.tireSize!,
            speedIndexId: parsed.data.tireSpeedIndexId!,
            loadIndexId: parsed.data.tireLoadIndexId!,
            isXL: Boolean(parsed.data.tireIsXL),
            isRunFlat: Boolean(parsed.data.tireIsRunFlat)
          },
          create: {
            productId: updatedProduct.id,
            brandId: parsed.data.tireBrandId!,
            modelId: parsed.data.tireModelId!,
            size: parsed.data.tireSize!,
            speedIndexId: parsed.data.tireSpeedIndexId!,
            loadIndexId: parsed.data.tireLoadIndexId!,
            isXL: Boolean(parsed.data.tireIsXL),
            isRunFlat: Boolean(parsed.data.tireIsRunFlat)
          }
        });
      }

      if (isAuto) {
        await tx.tireProduct.deleteMany({
          where: { productId: updatedProduct.id }
        });
        await tx.autoProduct.upsert({
          where: { productId: updatedProduct.id },
          update: {
            brand: parsed.data.autoBrand!.trim(),
            model: parsed.data.autoModel!.trim(),
            subcategory: parsed.data.autoSubcategory!.trim()
          },
          create: {
            productId: updatedProduct.id,
            brand: parsed.data.autoBrand!.trim(),
            model: parsed.data.autoModel!.trim(),
            subcategory: parsed.data.autoSubcategory!.trim()
          }
        });
      }

      return tx.product.findUnique({
        where: { id: updatedProduct.id },
        include: {
          category: true,
          tireDetails: {
            include: {
              brand: true,
              model: true,
              speedIndex: true,
              loadIndex: true
            }
          },
          autoDetails: true
        }
      });
    });

    res.json(product);
  } catch (err: any) {
    if (err?.message === "Invalid brand" || err?.message === "Invalid brand/model") {
      return res.status(400).json({ error: err.message });
    }
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const productId = req.params.id;
    const [orderItemsCount, stockMovesCount] = await Promise.all([
      prisma.orderItem.count({ where: { productId } }),
      prisma.stockMovement.count({ where: { productId } })
    ]);

    if (orderItemsCount > 0 || stockMovesCount > 0) {
      return res.status(409).json({
        error: "Product is used in orders or stock movements"
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.tireProduct.deleteMany({ where: { productId } });
      await tx.autoProduct.deleteMany({ where: { productId } });
      await tx.product.delete({ where: { id: productId } });
    });
    res.json({ id: req.params.id });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    next(err);
  }
});

export default router;
