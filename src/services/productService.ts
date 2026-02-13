import prisma from "../prisma";
import { HttpError } from "./errors";
import type { PrismaClient } from "@prisma/client";
import type { CreateProductInput, UpdateProductInput } from "../validators/products";

const TIRE_CATEGORY = "Шини";

const includeProductDetails = {
  category: true,
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
  },
  unit: true
};

const resolveCategory = async (categoryId: string) => {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new HttpError(400, "Category not found");
  }
  return category;
};

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

const ensureTireMeta = async (tx: TransactionClient, data: CreateProductInput) => {
  let brand = null;
  if (data.tireBrandId) {
    brand = await tx.tireBrand.findUnique({ where: { id: data.tireBrandId } });
  } else if (data.tireBrandName) {
    brand = await tx.tireBrand.upsert({
      where: { name: data.tireBrandName.trim() },
      update: {},
      create: { name: data.tireBrandName.trim() }
    });
  }

  if (!brand) {
    throw new HttpError(400, "Invalid brand");
  }

  let model = null;
  if (data.tireModelId) {
    model = await tx.tireModel.findUnique({ where: { id: data.tireModelId } });
  } else if (data.tireModelName) {
    model = await tx.tireModel.upsert({
      where: {
        name_brandId: {
          name: data.tireModelName.trim(),
          brandId: brand.id
        }
      },
      update: {},
      create: {
        name: data.tireModelName.trim(),
        brandId: brand.id
      }
    });
  }

  if (!model || model.brandId !== brand.id) {
    throw new HttpError(400, "Invalid brand/model");
  }

  return { brand, model };
};

const ensureTireIndices = async (data: CreateProductInput) => {
  const [speedIndex, loadIndex] = await Promise.all([
    prisma.tireSpeedIndex.findUnique({ where: { id: data.tireSpeedIndexId } }),
    prisma.tireLoadIndex.findUnique({ where: { id: data.tireLoadIndexId } })
  ]);

  if (!speedIndex || !loadIndex) {
    throw new HttpError(400, "Invalid tire indices");
  }
};

const ensureUnit = async (unitId?: string) => {
  if (!unitId) {
    return;
  }
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    throw new HttpError(400, "Invalid unit");
  }
};

const ensureAutoSubcategory = async (subcategoryId?: string) => {
  if (!subcategoryId) {
    throw new HttpError(400, "Missing auto subcategory");
  }
  const subcategory = await prisma.autoSubcategory.findUnique({
    where: { id: subcategoryId }
  });
  if (!subcategory) {
    throw new HttpError(400, "Invalid auto subcategory");
  }
};

export const listProducts = async () => {
  return prisma.product.findMany({
    include: includeProductDetails,
    orderBy: { name: "asc" }
  });
};

export const createProduct = async (input: CreateProductInput) => {
  const category = await resolveCategory(input.categoryId);
  const isTire = category.name === TIRE_CATEGORY;
  const isAuto = !isTire;

  if (isTire) {
    if (
      !input.tireSize ||
      !input.tireSpeedIndexId ||
      !input.tireLoadIndexId ||
      (!input.tireBrandId && !input.tireBrandName) ||
      (!input.tireModelId && !input.tireModelName)
    ) {
      throw new HttpError(400, "Missing tire fields");
    }
    await ensureTireIndices(input);
  }

  if (isAuto) {
    if (!input.autoBrand?.trim() || !input.autoModel?.trim()) {
      throw new HttpError(400, "Missing brand/model");
    }
    await ensureAutoSubcategory(input.autoSubcategoryId);
  }

  await ensureUnit(input.unitId);

  return prisma.$transaction(async (tx: TransactionClient) => {
    if (isTire) {
      const { brand, model } = await ensureTireMeta(tx, input);
      input.tireBrandId = brand.id;
      input.tireModelId = model.id;
      input.tireBrandName = brand.name;
      input.tireModelName = model.name;
    }

    const nameParts = isTire
      ? [
          input.tireBrandName?.trim() ?? "",
          input.tireModelName?.trim() ?? ""
        ].filter(Boolean)
      : [
          input.autoBrand?.trim() ?? "",
          input.autoModel?.trim() ?? ""
        ].filter(Boolean);

    if (isTire) {
      if (input.tireIsXL) {
        nameParts.push("XL");
      }
      if (input.tireIsRunFlat) {
        nameParts.push("RunFlat");
      }
    }

    const product = await tx.product.create({
      data: {
        name: nameParts.join(" ").trim(),
        categoryId: input.categoryId,
        unitId: input.unitId
      }
    });

    if (isTire) {
      await tx.tireProduct.create({
        data: {
          productId: product.id,
          brandId: input.tireBrandId!,
          modelId: input.tireModelId!,
          size: input.tireSize!,
          speedIndexId: input.tireSpeedIndexId!,
          loadIndexId: input.tireLoadIndexId!,
          isXL: Boolean(input.tireIsXL),
          isRunFlat: Boolean(input.tireIsRunFlat)
        }
      });
    }

    if (isAuto) {
      await tx.autoProduct.create({
        data: {
          productId: product.id,
          brand: input.autoBrand!.trim(),
          model: input.autoModel!.trim(),
          subcategoryId: input.autoSubcategoryId!
        }
      });
    }

    return tx.product.findUnique({
      where: { id: product.id },
      include: includeProductDetails
    });
  });
};

export const updateProduct = async (id: string, input: UpdateProductInput) => {
  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) {
    throw new HttpError(404, "Product not found");
  }

  const category = await resolveCategory(input.categoryId);
  const isTire = category.name === TIRE_CATEGORY;
  const isAuto = !isTire;

  if (isTire) {
    if (
      !input.tireSize ||
      !input.tireSpeedIndexId ||
      !input.tireLoadIndexId ||
      (!input.tireBrandId && !input.tireBrandName) ||
      (!input.tireModelId && !input.tireModelName)
    ) {
      throw new HttpError(400, "Missing tire fields");
    }
    await ensureTireIndices(input);
  }

  if (isAuto) {
    if (!input.autoBrand?.trim() || !input.autoModel?.trim()) {
      throw new HttpError(400, "Missing brand/model");
    }
    await ensureAutoSubcategory(input.autoSubcategoryId);
  }

  await ensureUnit(input.unitId);

  return prisma.$transaction(async (tx: TransactionClient) => {
    if (isTire) {
      const { brand, model } = await ensureTireMeta(tx, input);
      input.tireBrandId = brand.id;
      input.tireModelId = model.id;
      input.tireBrandName = brand.name;
      input.tireModelName = model.name;
    }

    const nameParts = isTire
      ? [
          input.tireBrandName?.trim() ?? "",
          input.tireModelName?.trim() ?? ""
        ].filter(Boolean)
      : [
          input.autoBrand?.trim() ?? "",
          input.autoModel?.trim() ?? ""
        ].filter(Boolean);

    if (isTire) {
      if (input.tireIsXL) {
        nameParts.push("XL");
      }
      if (input.tireIsRunFlat) {
        nameParts.push("RunFlat");
      }
    }

    const updatedProduct = await tx.product.update({
      where: { id },
      data: {
        name: nameParts.join(" ").trim(),
        categoryId: input.categoryId,
        unitId: input.unitId
      }
    });

    if (isTire) {
      await tx.autoProduct.deleteMany({ where: { productId: updatedProduct.id } });
      await tx.tireProduct.upsert({
        where: { productId: updatedProduct.id },
        update: {
          brandId: input.tireBrandId!,
          modelId: input.tireModelId!,
          size: input.tireSize!,
          speedIndexId: input.tireSpeedIndexId!,
          loadIndexId: input.tireLoadIndexId!,
          isXL: Boolean(input.tireIsXL),
          isRunFlat: Boolean(input.tireIsRunFlat)
        },
        create: {
          productId: updatedProduct.id,
          brandId: input.tireBrandId!,
          modelId: input.tireModelId!,
          size: input.tireSize!,
          speedIndexId: input.tireSpeedIndexId!,
          loadIndexId: input.tireLoadIndexId!,
          isXL: Boolean(input.tireIsXL),
          isRunFlat: Boolean(input.tireIsRunFlat)
        }
      });
    }

    if (isAuto) {
      await tx.tireProduct.deleteMany({ where: { productId: updatedProduct.id } });
      await tx.autoProduct.upsert({
        where: { productId: updatedProduct.id },
        update: {
          brand: input.autoBrand!.trim(),
          model: input.autoModel!.trim(),
          subcategoryId: input.autoSubcategoryId!
        },
        create: {
          productId: updatedProduct.id,
          brand: input.autoBrand!.trim(),
          model: input.autoModel!.trim(),
          subcategoryId: input.autoSubcategoryId!
        }
      });
    }

    return tx.product.findUnique({
      where: { id: updatedProduct.id },
      include: includeProductDetails
    });
  });
};

export const deleteProduct = async (id: string) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Product not found");
  }

  const [orderItemsCount, stockMovesCount] = await Promise.all([
    prisma.orderItem.count({ where: { productId: id } }),
    prisma.stockMovement.count({ where: { productId: id } })
  ]);

  if (orderItemsCount > 0 || stockMovesCount > 0) {
    throw new HttpError(409, "Product is used in orders or stock movements");
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.tireProduct.deleteMany({ where: { productId: id } });
    await tx.autoProduct.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
  });
};
