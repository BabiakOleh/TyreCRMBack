import prisma from "../prisma";

export const getCashBalanceCents = async () => {
  const [income, expense] = await Promise.all([
    prisma.cashDocument.aggregate({
      where: { type: "INCOME" },
      _sum: { amountCents: true }
    }),
    prisma.cashDocument.aggregate({
      where: { type: "EXPENSE" },
      _sum: { amountCents: true }
    })
  ]);
  const inSum = income._sum.amountCents ?? 0;
  const outSum = expense._sum.amountCents ?? 0;
  return inSum - outSum;
};
