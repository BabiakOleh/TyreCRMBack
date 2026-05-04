import prisma from "../prisma";
import { getCashBalanceCents } from "./cashBalance";

type OrderListWhere = NonNullable<Parameters<typeof prisma.order.findMany>[0]>["where"];

const ORDER_IN_REPORT: OrderListWhere = {
  status: { in: ["CONFIRMED", "COMPLETED"] }
};

const TIRE_CATEGORY = "Шини";

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const dateRangeFilter = (from?: string, to?: string) => {
  if (!from && !to) return undefined;
  const orderDate: { gte?: Date; lte?: Date } = {};
  if (from) {
    const s = new Date(from);
    if (!Number.isNaN(s.getTime())) orderDate.gte = s;
  }
  if (to) {
    const e = new Date(to);
    if (!Number.isNaN(e.getTime())) orderDate.lte = endOfDay(e);
  }
  return Object.keys(orderDate).length ? orderDate : undefined;
};

export const buildReportSummary = async (from?: string, to?: string) => {
  const orderDate = dateRangeFilter(from, to);
  const orderWhereWithDate: OrderListWhere = {
    ...ORDER_IN_REPORT,
    ...(orderDate ? { orderDate } : {})
  };

  const cashBalanceCents = await getCashBalanceCents();

  const [suppliers, customers] = await Promise.all([
    prisma.counterparty.findMany({ where: { type: "SUPPLIER" } }),
    prisma.counterparty.findMany({ where: { type: "CUSTOMER" } })
  ]);

  const [allPurchaseOrders, allSaleOrders, paymentRows] = await Promise.all([
    prisma.order.findMany({
      where: { type: "PURCHASE", ...ORDER_IN_REPORT },
      select: { totalCents: true, counterpartyId: true }
    }),
    prisma.order.findMany({
      where: { type: "SALE", ...ORDER_IN_REPORT },
      select: { totalCents: true, counterpartyId: true }
    }),
    prisma.cashDocument.findMany({
      where: {
        OR: [
          { type: "EXPENSE", subtype: "SUPPLIER_PAYMENT" },
          { type: "INCOME", subtype: "CUSTOMER_PAYMENT" }
        ]
      },
      select: { type: true, subtype: true, counterpartyId: true, amountCents: true }
    })
  ]);

  const purchaseBySupplier = new Map<string, number>();
  for (const o of allPurchaseOrders) {
    if (!o.counterpartyId) continue;
    purchaseBySupplier.set(
      o.counterpartyId,
      (purchaseBySupplier.get(o.counterpartyId) ?? 0) + o.totalCents
    );
  }

  const salesByCustomerAll = new Map<string, number>();
  for (const o of allSaleOrders) {
    if (!o.counterpartyId) continue;
    salesByCustomerAll.set(
      o.counterpartyId,
      (salesByCustomerAll.get(o.counterpartyId) ?? 0) + o.totalCents
    );
  }

  const supplierPayments = new Map<string, number>();
  const customerPayments = new Map<string, number>();
  for (const p of paymentRows) {
    if (!p.counterpartyId) continue;
    if (p.type === "EXPENSE" && p.subtype === "SUPPLIER_PAYMENT") {
      supplierPayments.set(
        p.counterpartyId,
        (supplierPayments.get(p.counterpartyId) ?? 0) + p.amountCents
      );
    }
    if (p.type === "INCOME" && p.subtype === "CUSTOMER_PAYMENT") {
      customerPayments.set(
        p.counterpartyId,
        (customerPayments.get(p.counterpartyId) ?? 0) + p.amountCents
      );
    }
  }

  const supplierDebts = suppliers.map((s) => {
    const purchasesCents = purchaseBySupplier.get(s.id) ?? 0;
    const paymentsCents = supplierPayments.get(s.id) ?? 0;
    return {
      supplier: { id: s.id, name: s.name },
      purchasesCents,
      paymentsCents,
      debtCents: purchasesCents - paymentsCents
    };
  });

  const customerDebts = customers.map((c) => {
    const salesCents = salesByCustomerAll.get(c.id) ?? 0;
    const paymentsCents = customerPayments.get(c.id) ?? 0;
    return {
      customer: { id: c.id, name: c.name },
      salesCents,
      paymentsCents,
      debtCents: salesCents - paymentsCents
    };
  });

  const periodPurchases = await prisma.order.findMany({
    where: { type: "PURCHASE", ...orderWhereWithDate },
    select: { totalCents: true, counterpartyId: true, counterparty: { select: { id: true, name: true } } }
  });

  const periodSales = await prisma.order.findMany({
    where: { type: "SALE", ...orderWhereWithDate },
    select: { totalCents: true, counterpartyId: true, counterparty: { select: { id: true, name: true } } }
  });

  const purchasesBySupplierMap = new Map<string, { supplier: { id: string; name: string }; purchasesCents: number }>();
  for (const o of periodPurchases) {
    const cp = o.counterparty;
    if (!cp) continue;
    const prev = purchasesBySupplierMap.get(cp.id)?.purchasesCents ?? 0;
    purchasesBySupplierMap.set(cp.id, {
      supplier: { id: cp.id, name: cp.name },
      purchasesCents: prev + o.totalCents
    });
  }

  const salesByCustomerPeriodMap = new Map<
    string,
    { customer: { id: string; name: string }; salesCents: number }
  >();
  for (const o of periodSales) {
    const cp = o.counterparty;
    if (!cp) continue;
    const prev = salesByCustomerPeriodMap.get(cp.id)?.salesCents ?? 0;
    salesByCustomerPeriodMap.set(cp.id, {
      customer: { id: cp.id, name: cp.name },
      salesCents: prev + o.totalCents
    });
  }

  const tireCategory = await prisma.category.findFirst({ where: { name: TIRE_CATEGORY } });

  let totalQuantity = 0;
  let totalSalesCents = 0;
  let totalPurchasesCents = 0;

  if (tireCategory) {
    const saleItems = await prisma.orderItem.findMany({
      where: {
        order: { type: "SALE", ...orderWhereWithDate },
        product: { categoryId: tireCategory.id }
      },
      select: {
        quantity: true,
        priceCents: true
      }
    });
    for (const it of saleItems) {
      totalQuantity += it.quantity;
      totalSalesCents += it.priceCents * it.quantity;
    }

    const purchaseItems = await prisma.orderItem.findMany({
      where: {
        order: { type: "PURCHASE", ...orderWhereWithDate },
        product: { categoryId: tireCategory.id }
      },
      select: {
        quantity: true,
        priceCents: true
      }
    });
    for (const it of purchaseItems) {
      totalPurchasesCents += it.priceCents * it.quantity;
    }
  }

  const averagePricePerTire =
    totalQuantity > 0 ? Math.round(totalSalesCents / totalQuantity) : null;
  const averageMargin =
    totalPurchasesCents > 0 ? totalSalesCents / totalPurchasesCents : null;

  return {
    cashBalanceCents,
    supplierDebts,
    customerDebts,
    salesByCustomer: [...salesByCustomerPeriodMap.values()],
    purchasesBySupplier: [...purchasesBySupplierMap.values()],
    tiresStats: {
      totalQuantity,
      totalSalesCents,
      totalPurchasesCents,
      averagePricePerTire,
      averageMargin
    }
  };
};
