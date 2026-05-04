import { Router } from "express";
import { z } from "zod";
import { buildReportSummary } from "../services/reportService";

const router = Router();

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional()
});

router.get("/summary", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.issues });
  }

  const summary = await buildReportSummary(parsed.data.from, parsed.data.to);
  res.json(summary);
});

export default router;
