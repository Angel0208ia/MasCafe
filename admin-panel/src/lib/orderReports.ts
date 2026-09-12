import type { BusinessOrder } from "./types";

export type ReportPeriod = "day" | "week" | "month";
export type ReportOrder = Omit<BusinessOrder, "order_status_events">;
export const PERIOD_LABELS: Record<ReportPeriod, string> = { day: "Diario", week: "Semanal", month: "Mensual" };
const DAY_MS = 86_400_000;

export function businessDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Cancun", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (name: string) => parts.find((item) => item.type === name)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function periodRange(date: string, period: ReportPeriod) {
  // Cancún permanece en UTC-5. Los límites son locales e incluyen todo el último día.
  const anchor = new Date(`${date}T00:00:00-05:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(anchor.getTime()) || businessDate(anchor) !== date) {
    throw new Error("Fecha inválida");
  }
  let start = anchor.getTime();
  let end = start + DAY_MS;
  if (period === "week") {
    start -= ((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7) * DAY_MS;
    end = start + 7 * DAY_MS;
  } else if (period === "month") {
    const [year, month] = date.split("-").map(Number);
    start = Date.UTC(year, month - 1, 1, 5);
    end = Date.UTC(year, month, 1, 5);
  }
  return { start, end };
}

export function ordersInRange(orders: ReportOrder[], range: { start: number; end: number }) {
  return orders.filter((order) => {
    const time = new Date(order.created_at).getTime();
    return order.status !== "cancelled" && time >= range.start && time < range.end;
  });
}

export function summarizeOrders(orders: ReportOrder[]) {
  const valid = orders.filter((order) => order.status !== "cancelled");
  const delivered = valid.filter((order) => order.status === "delivered");
  const products = new Map<string, { id: string; name: string; quantity: number }>();
  for (const order of delivered) {
    for (const item of order.order_items) {
      const key = item.product_id ?? item.product_name;
      const product = products.get(key) ?? { id: key, name: item.product_name, quantity: 0 };
      product.quantity += item.quantity;
      products.set(key, product);
    }
  }
  return {
    count: valid.length,
    delivered: delivered.length,
    revenue: delivered.reduce((sum, order) => sum + Math.round(Number(order.total) * 100), 0) / 100,
    topProducts: [...products.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "es")).slice(0, 3),
  };
}

export function money(value: number | string) {
  return `${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value))} MXN`;
}
