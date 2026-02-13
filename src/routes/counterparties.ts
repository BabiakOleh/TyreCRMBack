import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = Router();

const normalizePhone = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("38")) {
    return digits.slice(2);
  }
  return digits;
};

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return value;
};

const optionalTrimmedString = (schema: z.ZodType<string>) =>
  z.preprocess(emptyToUndefined, schema.optional());

const createSchema = z.object({
  type: z.enum(["CUSTOMER", "SUPPLIER"]),
  name: z.string().min(3).max(120),
  phone: z.preprocess(
    normalizePhone,
    z.string().refine((value) => /^\d{10}$/.test(value), "Invalid phone")
  ),
  email: optionalTrimmedString(
    z.string().trim().refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Invalid email")
  ),
  taxId: optionalTrimmedString(z.string().min(5).max(30)),
  address: optionalTrimmedString(z.string().min(3).max(200)),
  note: optionalTrimmedString(z.string().max(500))
});

const updateSchema = createSchema;

router.get("/", async (req, res) => {
  const type = req.query.type as "CUSTOMER" | "SUPPLIER" | undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const includeInactive = req.query.inactive === "1";

  const where: any = {};
  if (type) {
    where.type = type;
  }
  if (!includeInactive) {
    where.isActive = true;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { taxId: { contains: q } }
    ];
  }

  const counterparties = await prisma.counterparty.findMany({
    where,
    orderBy: { name: "asc" }
  });

  res.json(counterparties);
});

router.post("/", async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: parsed.error.issues
    });
  }

  try {
    const counterparty = await prisma.counterparty.create({
      data: {
        type: parsed.data.type,
        name: parsed.data.name.trim(),
        phone: parsed.data.phone,
        email: parsed.data.email,
        taxId: parsed.data.taxId,
        address: parsed.data.address,
        note: parsed.data.note
      }
    });
    res.status(201).json(counterparty);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: parsed.error.issues
    });
  }

  try {
    const counterparty = await prisma.counterparty.update({
      where: { id: req.params.id },
      data: {
        type: parsed.data.type,
        name: parsed.data.name.trim(),
        phone: parsed.data.phone,
        email: parsed.data.email,
        taxId: parsed.data.taxId,
        address: parsed.data.address,
        note: parsed.data.note
      }
    });
    res.json(counterparty);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Counterparty not found" });
    }
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const counterparty = await prisma.counterparty.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json(counterparty);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Counterparty not found" });
    }
    next(err);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  const schema = z.object({
    isActive: z.boolean()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: parsed.error.issues
    });
  }

  try {
    const counterparty = await prisma.counterparty.update({
      where: { id: req.params.id },
      data: { isActive: parsed.data.isActive }
    });
    res.json(counterparty);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Counterparty not found" });
    }
    next(err);
  }
});

export default router;
