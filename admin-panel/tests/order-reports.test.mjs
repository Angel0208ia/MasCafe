import { test } from "node:test";
import assert from "node:assert/strict";
import { businessDate, money, ordersInRange, periodRange, summarizeOrders } from "../src/lib/orderReports.ts";

test("los importes se identifican como pesos mexicanos sin convertir valores", () => {
  assert.equal(money(1218), "$1,218.00 MXN");
  assert.equal(money("65.50"), "$65.50 MXN");
});

const order = (status, total, items = [], created_at = "2026-09-12T16:00:00Z") => ({
  id: "order", status, total, created_at, order_items: items,
});
const item = (product_id, product_name, quantity) => ({ product_id, product_name, quantity });

test("el día comercial respeta medianoche en Cancún y el límite final exclusivo", () => {
  assert.equal(businessDate(new Date("2026-09-12T04:59:59Z")), "2026-09-11");
  const range = periodRange("2026-09-12", "day");
  assert.equal(new Date(range.start).toISOString(), "2026-09-12T05:00:00.000Z");
  assert.equal(new Date(range.end).toISOString(), "2026-09-13T05:00:00.000Z");
  const rows = [order("delivered", 10, [], new Date(range.start).toISOString()), order("delivered", 20, [], new Date(range.end).toISOString())];
  assert.equal(ordersInRange(rows, range).length, 1);
});

test("semana lunes-domingo incluso al cruzar mes y año", () => {
  const range = periodRange("2027-01-03", "week");
  assert.equal(new Date(range.start).toISOString(), "2026-12-28T05:00:00.000Z");
  assert.equal(new Date(range.end).toISOString(), "2027-01-04T05:00:00.000Z");
  assert.deepEqual(periodRange("2026-12-28", "week"), range);
});

test("meses completos: febrero bisiesto y cambio de año", () => {
  const february = periodRange("2028-02-29", "month");
  assert.equal((february.end - february.start) / 86_400_000, 29);
  assert.equal(new Date(periodRange("2026-12-12", "month").end).toISOString(), "2027-01-01T05:00:00.000Z");
  assert.throws(() => periodRange("2026-02-30", "day"));
  assert.throws(() => periodRange("bad", "month"));
});

test("ingresos usan total final y excluyen cancelados y pedidos pendientes", () => {
  const report = summarizeOrders([order("delivered", "90.10"), order("delivered", "0.20"), order("received", 500), order("cancelled", 999)]);
  assert.equal(report.count, 3);
  assert.equal(report.delivered, 2);
  assert.equal(report.revenue, 90.3);
});

test("top tres agrupa por producto y cantidad, no por precio o nombre", () => {
  const report = summarizeOrders([
    order("delivered", 90, [item("a", "Café", 2), item("b", "Brownie", 1)]),
    order("delivered", 90, [item("a", "Café", 3), item("c", "Matcha", 4), item("d", "Agua", 2)]),
    order("received", 90, [item("b", "Brownie", 100)]),
    order("cancelled", 90, [item("b", "Brownie", 100)]),
  ]);
  assert.deepEqual(report.topProducts.map((product) => [product.id, product.quantity]), [["a", 5], ["c", 4], ["d", 2]]);
  assert.equal(summarizeOrders([]).topProducts.length, 0);
});

test("los resúmenes no se truncan a los últimos cien pedidos", () => {
  const report = summarizeOrders(Array.from({ length: 1200 }, () => order("delivered", 1)));
  assert.equal(report.count, 1200);
  assert.equal(report.revenue, 1200);
});
