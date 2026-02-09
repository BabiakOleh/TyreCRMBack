import { Router } from "express";
import prisma from "../prisma";

const router = Router();

router.get("/speed", async (_req, res) => {
  const indices = await prisma.tireSpeedIndex.findMany({
    orderBy: { maxKph: "asc" }
  });
  res.json(indices);
});

router.get("/load", async (_req, res) => {
  const indices = await prisma.tireLoadIndex.findMany({
    orderBy: { maxKg: "asc" }
  });
  res.json(indices);
});

export default router;
