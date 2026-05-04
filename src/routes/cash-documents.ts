import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { getCashBalanceCents } from "../services/cashBalance";

type CashDocumentListWhere = NonNullable<
  Parameters<typeof prisma.cashDocument.findMany>[0]
>["where"];

const router = Router();

const listSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  subtype: z
    .enum(["SUPPLIER_PAYMENT", "OTHER_EXPENSE", "CUSTOMER_PAYMENT", "OTHER_INCOME"])
    .optional(),
  counterpartyId: z.string().optional()
});

const createSchema = z.object({
  date: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  subtype: z.enum([
    "SUPPLIER_PAYMENT",
    "OTHER_EXPENSE",
    "CUSTOMER_PAYMENT",
    "OTHER_INCOME"
  ]),
  counterpartyId: z.string().optional(),
  amountCents: z.number().int().positive(),
  note: z.string().max(500).optional()
});

router.get("/", async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.issues });
  }

  const { from, to, type, subtype, counterpartyId } = parsed.data;
  const where: CashDocumentListWhere = {};

  if (type) where.type = type;
  if (subtype) where.subtype = subtype;
  if (counterpartyId) where.counterpartyId = counterpartyId;

  if (from || to) {
    where.date = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) where.date.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        where.date.lte = d;
      }
    }
  }

  const docs = await prisma.cashDocument.findMany({
    where,
    include: { counterparty: true },
    orderBy: { date: "desc" }
  });
  res.json(docs);
});

router.post("/", async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
  }

  const { date, type, subtype, counterpartyId, amountCents, note } = parsed.data;

  if (type === "INCOME" && !["CUSTOMER_PAYMENT", "OTHER_INCOME"].includes(subtype)) {
    return res.status(400).json({ error: "Subtype does not match type" });
  }
  if (type === "EXPENSE" && !["SUPPLIER_PAYMENT", "OTHER_EXPENSE"].includes(subtype)) {
    return res.status(400).json({ error: "Subtype does not match type" });
  }

  const needsCounterparty =
    subtype === "SUPPLIER_PAYMENT" || subtype === "CUSTOMER_PAYMENT";
  if (needsCounterparty && !counterpartyId) {
    return res.status(400).json({ error: "counterpartyId is required for this operation" });
  }

  if (counterpartyId) {
    const cp = await prisma.counterparty.findUnique({ where: { id: counterpartyId } });
    if (!cp) {
      return res.status(400).json({ error: "Counterparty not found" });
    }
    if (subtype === "SUPPLIER_PAYMENT" && cp.type !== "SUPPLIER") {
      return res.status(400).json({ error: "Invalid supplier" });
    }
    if (subtype === "CUSTOMER_PAYMENT" && cp.type !== "CUSTOMER") {
      return res.status(400).json({ error: "Invalid customer" });
    }
  }

  const docDate = new Date(date);
  if (Number.isNaN(docDate.getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  try {
    if (type === "EXPENSE") {
      const balance = await getCashBalanceCents();
      if (balance - amountCents < 0) {
        return res.status(400).json({ error: "Insufficient cash balance" });
      }
    }

    const created = await prisma.cashDocument.create({
      data: {
        date: docDate,
        type,
        subtype,
        counterpartyId: counterpartyId ?? null,
        amountCents,
        note: note ?? null
      },
      include: { counterparty: true }
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

export default router;
