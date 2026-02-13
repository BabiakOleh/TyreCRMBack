import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct
} from "../services/productService";
import { HttpError } from "../services/errors";
import {
  createProductSchema,
  updateProductSchema
} from "../validators/products";

const router = Router();

router.get("/", async (_req, res) => {
  const products = await listProducts();
  res.json(products);
});

router.post("/", async (req, res, next) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: parsed.error.issues
    });
  }

  try {
    const product = await createProduct(parsed.data);
    res.status(201).json(product);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Product already exists" });
    }
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: parsed.error.issues
    });
  }

  try {
    const product = await updateProduct(req.params.id, parsed.data);
    res.json(product);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ id: req.params.id });
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

export default router;
