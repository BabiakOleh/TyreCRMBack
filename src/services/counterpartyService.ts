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

  type CounterpartyRow = {
    id: string;
    type: "CUSTOMER" | "SUPPLIER";
    name: string;
    phone: string;
    email?: string | null;
    taxId?: string | null;
    address?: string | null;
    note?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  const counterparties = (await prisma.counterparty.findMany({
    where: where as unknown,
    orderBy: { name: "asc" }
  } as unknown)) as CounterpartyRow[];

  if (filters.type !== "SUPPLIER" || counterparties.length === 0) {
    return counterparties;
  }

  const supplierIds = counterparties.map((item) => item.id);
  type GroupRow = {
    counterpartyId: string | null;
    _sum: { totalCents: number | null };
  };

  const sums = (await prisma.order.groupBy({
    by: ["counterpartyId"],
    where: {
      type: "PURCHASE",
      status: { not: "CANCELLED" },
      counterpartyId: { in: supplierIds }
    },
    _sum: { totalCents: true }
  })) as GroupRow[];

  const totals = new Map(
    sums.map((row) => [row.counterpartyId, row._sum.totalCents ?? 0])
  );

  return counterparties.map((item) => ({
    ...item,
    payableCents: totals.get(item.id) ?? 0
  }));
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
