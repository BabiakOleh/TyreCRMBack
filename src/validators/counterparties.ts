import { z } from "zod";

const normalizePhone = (value: unknown) => {
  if (typeof value !== "string") return value;
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("38")) {
    return digits.slice(2);
  }
  return digits;
};

const optionalTrimmedString = (schema: z.ZodType<string>) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, schema.optional());

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const counterpartySchema = z.object({
  type: z.enum(["CUSTOMER", "SUPPLIER"]),
  name: z.string().trim().min(3),
  phone: z
    .preprocess(normalizePhone, z.string())
    .refine((value) => /^\d{10}$/.test(value), "Invalid phone"),
  email: optionalTrimmedString(z.string().refine((value) => emailRegex.test(value), "Invalid email")),
  taxId: optionalTrimmedString(z.string().min(5)),
  address: optionalTrimmedString(z.string().min(3)),
  note: optionalTrimmedString(z.string())
});

export const updateCounterpartySchema = counterpartySchema;

export type CounterpartyInput = z.infer<typeof counterpartySchema>;
export type CounterpartyUpdateInput = z.infer<typeof updateCounterpartySchema>;
