import { Router } from "express";
import { z } from "zod";
import {
  createCounterparty,
  deleteCounterparty,
  listCounterparties,
  setCounterpartyStatus,
  updateCounterparty
} from "../services/counterpartyService";
import { HttpError } from "../services/errors";
import {
  counterpartySchema,
  updateCounterpartySchema
} from "../validators/counterparties";

const router = Router();

router.get("/", async (req, res) => {
  const type = req.query.type as "CUSTOMER" | "SUPPLIER" | undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const includeInactive = req.query.inactive === "1";
  try {
    const counterparties = await listCounterparties({
      includeInactive,
      type,
      q: q || undefined
    });
    res.json(counterparties);
  } catch (error) {
    res.status(500).json({ error: "Failed to load counterparties" });
  }
});

router.post("/", async (req, res, next) => {
  const parsed = counterpartySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: parsed.error.issues
    });
  }

  try {
    const counterparty = await createCounterparty(parsed.data);
    res.status(201).json(counterparty);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  const parsed = updateCounterpartySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid data",
      details: parsed.error.issues
    });
  }

  try {
    const counterparty = await updateCounterparty(req.params.id, parsed.data);
    res.json(counterparty);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const counterparty = await deleteCounterparty(req.params.id);
    res.json(counterparty);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
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
    const counterparty = await setCounterpartyStatus(req.params.id, parsed.data.isActive);
    res.json(counterparty);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

export default router;
