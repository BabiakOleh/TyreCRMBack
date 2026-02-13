import prisma from "../prisma";
import { HttpError } from "./errors";
import type { CounterpartyInput, CounterpartyUpdateInput } from "../validators/counterparties";
import { ListFilters } from "./types";

export const listCounterparties = async (filters: ListFilters) => {
  const where: Record<string, unknown> = {};
  if (filters.type) {
    where.type = filters.type;
  }
  if (!filters.includeInactive) {
    where.isActive = true;
  }
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q } },
      { taxId: { contains: filters.q } }
    ];
  }

  const args = {
    where,
    orderBy: { name: "asc" }
  } as unknown as Parameters<typeof prisma.counterparty.findMany>[0];

  return prisma.counterparty.findMany(args);
};

export const createCounterparty = async (input: CounterpartyInput) => {
  return prisma.counterparty.create({ data: input });
};

export const updateCounterparty = async (id: string, input: CounterpartyUpdateInput) => {
  const existing = await prisma.counterparty.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Counterparty not found");
  }
  return prisma.counterparty.update({ where: { id }, data: input });
};

export const deleteCounterparty = async (id: string) => {
  const existing = await prisma.counterparty.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Counterparty not found");
  }
  return prisma.counterparty.update({
    where: { id },
    data: { isActive: false }
  });
};

export const setCounterpartyStatus = async (id: string, isActive: boolean) => {
  const existing = await prisma.counterparty.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Counterparty not found");
  }
  return prisma.counterparty.update({
    where: { id },
    data: { isActive }
  });
};
