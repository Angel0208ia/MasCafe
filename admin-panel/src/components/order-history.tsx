"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, RefreshCw, Search, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { businessDate, money, ordersInRange, PERIOD_LABELS, periodRange, summarizeOrders, type ReportOrder, type ReportPeriod } from "@/lib/orderReports";
import type { BusinessOrder, OrderStatus } from "@/lib/types";
import styles from "./order-history.module.css";

const PERIODS: ReportPeriod[] = ["day", "week", "month"];
const STATUSES: Partial<Record<OrderStatus, string>> = {
  received: "Recibido", preparing: "Preparando", ready: "Listo", delivered: "Entregado",
};
const dateFormat = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Cancun", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});
const shortDate = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Cancun", day: "numeric", month: "short" });

export function OrderHistory({ revision }: { revision: BusinessOrder[] }) {
  const [date, setDate] = useState(() => businessDate());
  const [period, setPeriod] = useState<ReportPeriod>("day");
  const [result, setResult] = useState<{ date: string; orders: ReportOrder[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const ranges = useMemo(() => Object.fromEntries(PERIODS.map((key) => [key, periodRange(date, key)])) as Record<ReportPeriod, { start: number; end: number }>, [date]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const start = Math.min(...Object.values(ranges).map((range) => range.start));
        const end = Math.max(...Object.values(ranges).map((range) => range.end));
        const supabase = createClient();
        const records: ReportOrder[] = [];
        // Leer todas las páginas: el límite de 100 de Operación no afecta los reportes.
        for (let offset = 0; !controller.signal.aborted; offset += 500) {
          const { data, error: requestError } = await supabase.from("orders")
            .select("id, pickup_code, status, total, created_at, updated_at, order_items (id, product_id, product_name, quantity, unit_price, selections, notes)")
            .neq("status", "cancelled")
            .gte("created_at", new Date(start).toISOString()).lt("created_at", new Date(end).toISOString())
            .order("created_at", { ascending: false }).order("id", { ascending: false })
            .range(offset, offset + 499).abortSignal(controller.signal);
          if (requestError) throw requestError;
          records.push(...(data ?? []) as unknown as ReportOrder[]);
          if (!data || data.length < 500) break;
        }
        if (!controller.signal.aborted) setResult({ date, orders: [...new Map(records.map((order) => [order.id, order])).values()] });
      } catch {
        if (!controller.signal.aborted) {
          setResult(null);
          setError("No se pudo cargar el registro. Intenta actualizar nuevamente.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [date, ranges, refresh, revision]);

  const orders = useMemo(() => result?.date === date ? result.orders : [], [result, date]);
  const summaries = useMemo(() => PERIODS.map((key) => ({ key, ...summarizeOrders(ordersInRange(orders, ranges[key])) })), [orders, ranges]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es-MX");
    return ordersInRange(orders, ranges[period]).filter((order) =>
      (status === "all" || order.status === status) && (!normalized ||
        order.pickup_code.toLocaleLowerCase("es-MX").includes(normalized) ||
        order.order_items.some((item) => item.product_name.toLocaleLowerCase("es-MX").includes(normalized))));
  }, [orders, ranges, period, query, status]);
  const pages = Math.max(1, Math.ceil(visible.length / 20));
  const currentPage = Math.min(page, pages - 1);
  const unavailable = loading || !result || result.date !== date;

  return <div className={styles.history}>
    <div className={styles.toolbar}>
      <div><h2>Registro y resultados</h2><p>Consulta cualquier fecha. Semana de lunes a domingo · Hora de Cancún.</p></div>
      <div className={styles.controls}>
        <label><CalendarDays size={17} /><span className={styles.srOnly}>Fecha del reporte</span><input type="date" value={date} onChange={(event) => {
          if (event.target.value) { try { periodRange(event.target.value, "day"); setDate(event.target.value); setPage(0); } catch { /* Conserva la última fecha válida. */ } }
        }} /></label>
        <button onClick={() => setRefresh((value) => value + 1)} disabled={loading} aria-label="Actualizar registro"><RefreshCw size={18} className={loading ? styles.spin : ""} /></button>
      </div>
    </div>
    <p className={styles.note}>Ingresos y productos más vendidos: solo pedidos entregados, usando el total después de promociones. Los cancelados no se incluyen.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <section className={styles.reports} aria-label="Resúmenes de pedidos">
      {summaries.map((summary) => <article key={summary.key} className={styles.report}>
        <div className={styles.reportHeading}><span>{PERIOD_LABELS[summary.key]}</span><small>{shortDate.format(ranges[summary.key].start)}{summary.key !== "day" && ` – ${shortDate.format(ranges[summary.key].end - 1)}`}</small></div>
        <div className={styles.numbers}><div><span>Pedidos</span><strong>{unavailable ? "—" : summary.count}</strong></div><div><span>Ingresos</span><strong>{unavailable ? "—" : money(summary.revenue)}</strong></div></div>
        <p className={styles.delivered}>{unavailable ? "Cargando…" : `${summary.delivered} pedidos entregados`}</p>
        <h3><Trophy size={16} />Los 3 más vendidos</h3>
        {!unavailable && summary.topProducts.length > 0 ? <ol className={styles.ranking}>{summary.topProducts.map((product, index) => <li key={product.id}><b>{index + 1}</b><span>{product.name}</span><strong>{product.quantity} {product.quantity === 1 ? "unidad" : "unidades"}</strong></li>)}</ol> : <p className={styles.emptyTop}>{unavailable ? "Consultando resultados…" : "Sin ventas entregadas en este periodo."}</p>}
      </article>)}
    </section>
    <section className={styles.registry} aria-label="Historial de pedidos">
      <div className={styles.registryHeader}><div><h2>Pedidos del periodo</h2><p>{unavailable ? "Cargando registro…" : `${visible.length} pedidos encontrados`}</p></div><div className={styles.tabs}>{PERIODS.map((key) => <button key={key} aria-pressed={period === key} className={period === key ? styles.active : ""} onClick={() => { setPeriod(key); setPage(0); }}>{PERIOD_LABELS[key]}</button>)}</div></div>
      <div className={styles.filters}><label className={styles.search}><Search size={17} /><input placeholder="Buscar código o producto" aria-label="Buscar en el registro" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} /></label><select aria-label="Filtrar estado" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}><option value="all">Todos los estados</option>{Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {!unavailable && visible.slice(currentPage * 20, (currentPage + 1) * 20).map((order) => <details key={order.id} className={styles.order}>
        <summary><div><strong>{order.pickup_code}</strong><span>{dateFormat.format(new Date(order.created_at))}</span></div><span className={styles.status}>{STATUSES[order.status]}</span><b>{money(order.total)}</b><ChevronDown size={18} /></summary>
        <div className={styles.items}>{order.order_items.map((item) => <div key={item.id}><div><strong>{item.quantity} × {item.product_name}</strong><p>{item.selections.flatMap((selection) => selection.options.map((option) => option.name)).join(" · ")}</p>{item.notes && <small>Nota: {item.notes}</small>}</div><b>{money(Number(item.unit_price) * item.quantity)}</b></div>)}<p>Total del pedido (con promociones): <strong>{money(order.total)}</strong></p></div>
      </details>)}
      {!unavailable && visible.length === 0 && <p className={styles.empty}>No hay pedidos para estos filtros.</p>}
      {unavailable && <p className={styles.empty} role="status">{error ? "Registro no disponible." : "Consultando pedidos…"}</p>}
      <div className={styles.pagination}><button disabled={unavailable || currentPage === 0} onClick={() => setPage(currentPage - 1)}>Anterior</button><span>Página {currentPage + 1} de {pages}</span><button disabled={unavailable || currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Siguiente</button></div>
    </section>
  </div>;
}
