import { z } from "zod";

export const createProductSchema = z.object({
  categoryId: z.string().min(1),
  unitId: z.string().min(1).optional(),
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
  autoSubcategoryId: z.string().min(1).optional()
});

export const updateProductSchema = createProductSchema;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
