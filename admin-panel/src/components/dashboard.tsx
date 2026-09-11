"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Bell, Check, ChevronRight, CircleDot, ClipboardList, Coffee, CookingPot, LayoutDashboard, LoaderCircle, LogOut, PackageCheck, RefreshCw, Search, Settings, ShoppingBag, Store, Tag, Users, X } from "lucide-react";
import { signOut } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import type { BusinessOrder, OrderStatus, StaffRole } from "@/lib/types";
import styles from "./dashboard.module.css";

type Filter = "active" | OrderStatus | "all";

const STATUS: Record<OrderStatus, { label: string; short: string; tone: string }> = {
  received: { label: "Pedido recibido", short: "Recibido", tone: "received" },
  preparing: { label: "En preparación", short: "Preparando", tone: "preparing" },
  ready: { label: "Listo para recoger", short: "Listo", tone: "ready" },
  delivered: { label: "Pedido entregado", short: "Entregado", tone: "delivered" },
  cancelled: { label: "Pedido cancelado", short: "Cancelado", tone: "cancelled" },
};

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "active", label: "En proceso" },
  { value: "received", label: "Recibidos" },
  { value: "preparing", label: "Preparando" },
  { value: "ready", label: "Listos" },
  { value: "all", label: "Todos" },
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: "America/Cancun", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: "America/Cancun", day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function isToday(value: string) {
  const dateKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cancun", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return dateKey(new Date(value)) === dateKey(new Date());
}

function itemCount(order: BusinessOrder) {
  return order.order_items.reduce((total, item) => total + item.quantity, 0);
}

function nextStatus(status: OrderStatus): OrderStatus | null {
  if (status === "received") return "preparing";
  if (status === "preparing") return "ready";
  if (status === "ready") return "delivered";
  return null;
}

function nextActionLabel(status: OrderStatus) {
  if (status === "received") return "Comenzar preparación";
  if (status === "preparing") return "Marcar como listo";
  if (status === "ready") return "Confirmar entrega";
  return "Pedido finalizado";
}

export function Dashboard({ initialOrders, staffName, role }: { initialOrders: BusinessOrder[]; staffName: string; role: StaffRole }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialOrders[0]?.id ?? "");
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notice, setNotice] = useState("");

  const loadOrders = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(`id, pickup_code, status, total, created_at, updated_at, order_items (id, product_id, product_name, quantity, unit_price, selections, notes), order_status_events (id, status, created_at)`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) {
      const nextOrders = data as unknown as BusinessOrder[];
      setOrders(nextOrders);
      setSelectedId((current) => current || nextOrders[0]?.id || "");
    }
    if (showSpinner) setRefreshing(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("business-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { void loadOrders(); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadOrders]);

  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es-MX");
    return orders.filter((order) => {
      const matchesFilter = filter === "all" || (filter === "active" && ["received", "preparing", "ready"].includes(order.status)) || order.status === filter;
      const matchesQuery = !normalized || order.pickup_code.toLocaleLowerCase("es-MX").includes(normalized) || order.order_items.some((item) => item.product_name.toLocaleLowerCase("es-MX").includes(normalized));
      return matchesFilter && matchesQuery;
    });
  }, [filter, orders, query]);

  const effectiveSelectedId = visibleOrders.some((order) => order.id === selectedId)
    ? selectedId
    : visibleOrders[0]?.id ?? "";
  const selected = orders.find((order) => order.id === effectiveSelectedId);
  const todayOrders = orders.filter((order) => isToday(order.created_at));
  const metrics = {
    received: todayOrders.filter((order) => order.status === "received").length,
    preparing: todayOrders.filter((order) => order.status === "preparing").length,
    ready: todayOrders.filter((order) => order.status === "ready").length,
    sales: todayOrders.filter((order) => order.status !== "cancelled").reduce((total, order) => total + Number(order.total), 0),
  };

  const updateStatus = useCallback(async (order: BusinessOrder, status: OrderStatus) => {
    setUpdating(true);
    setNotice("");
    const { error } = await createClient().rpc("staff_update_order_status", { p_order_id: order.id, p_status: status });
    if (error) {
      setNotice("No se pudo actualizar el pedido. Intenta nuevamente.");
      setUpdating(false);
      return false;
    }
    setNotice(`Pedido ${order.pickup_code}: ${STATUS[status].label.toLocaleLowerCase("es-MX")}.`);
    await loadOrders();
    setUpdating(false);
    return true;
  }, [loadOrders]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(context.registerTool({
      name: "list_orders",
      title: "Consultar pedidos",
      description: "Devuelve los pedidos visibles del panel y su estado actual.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => orders.map((order) => ({
        id: order.id,
        code: order.pickup_code,
        status: order.status,
        total: Number(order.total),
        itemCount: itemCount(order),
      })),
    }, { signal: lifecycle.signal })).catch(() => undefined);

    void Promise.resolve(context.registerTool({
      name: "open_order",
      title: "Abrir pedido",
      description: "Selecciona un pedido existente para mostrar su detalle en el panel.",
      inputSchema: {
        type: "object",
        properties: { orderId: { type: "string" } },
        required: ["orderId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input) => {
        const orderId = typeof input === "object" && input && "orderId" in input
          ? String(input.orderId)
          : "";
        const order = orders.find((item) => item.id === orderId);
        if (!order) throw new Error("Pedido no encontrado");
        setFilter("all");
        setSelectedId(order.id);
        return { selected: order.id, code: order.pickup_code };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    void Promise.resolve(context.registerTool({
      name: "update_order_status",
      title: "Actualizar estado del pedido",
      description: "Avanza o cancela un pedido usando las mismas reglas del panel.",
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          status: { type: "string", enum: ["preparing", "ready", "delivered", "cancelled"] },
        },
        required: ["orderId", "status"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input) => {
        const record = typeof input === "object" && input ? input as Record<string, unknown> : {};
        const order = orders.find((item) => item.id === String(record.orderId ?? ""));
        const requested = String(record.status ?? "") as OrderStatus;
        if (!order) throw new Error("Pedido no encontrado");
        const allowed = requested === nextStatus(order.status)
          || (requested === "cancelled" && ["received", "preparing"].includes(order.status));
        if (!allowed) throw new Error("Cambio de estado no permitido");
        const updated = await updateStatus(order, requested);
        if (!updated) throw new Error("No se pudo actualizar el pedido");
        return { id: order.id, code: order.pickup_code, status: requested };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    return () => lifecycle.abort();
  }, [orders, updateStatus]);

  const displayDate = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Cancun", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logoRow}><div className={styles.logo}><Coffee size={25} /></div><div><strong>Más Café</strong><span>Panel de negocio</span></div></div>
        <nav className={styles.navigation} aria-label="Navegación principal">
          <button className={styles.navActive}><LayoutDashboard size={19} />Operación</button>
          <button disabled><ClipboardList size={19} />Pedidos</button>
          <button disabled><Store size={19} />Menú <small>Pronto</small></button>
          <button disabled><Tag size={19} />Promociones <small>Pronto</small></button>
          {role === "admin" && <button disabled><Users size={19} />Personal <small>Pronto</small></button>}
        </nav>
        <div className={styles.sidebarFooter}><div className={styles.userAvatar}>{staffName.slice(0, 1).toLocaleUpperCase("es-MX")}</div><div className={styles.userInfo}><strong>{staffName}</strong><span>{role === "admin" ? "Administrador" : "Personal"}</span></div><form action={signOut}><button type="submit" aria-label="Cerrar sesión"><LogOut size={18} /></button></form></div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}><div><p>{displayDate}</p><h1>Operación de hoy</h1></div><div className={styles.topActions}><span className={styles.live}><i />En vivo</span><button aria-label="Notificaciones"><Bell size={19} /></button><button aria-label="Configuración"><Settings size={19} /></button></div></header>

        <section className={styles.metrics} aria-label="Resumen del día">
          <article><span className={styles.metricIconReceived}><ShoppingBag size={20} /></span><div><p>Recibidos</p><strong>{metrics.received}</strong></div></article>
          <article><span className={styles.metricIconPreparing}><CookingPot size={20} /></span><div><p>Preparando</p><strong>{metrics.preparing}</strong></div></article>
          <article><span className={styles.metricIconReady}><PackageCheck size={20} /></span><div><p>Listos</p><strong>{metrics.ready}</strong></div></article>
          <article><span className={styles.metricIconSales}><BadgeDollarSign size={20} /></span><div><p>Venta del día</p><strong>${metrics.sales.toFixed(2)}</strong></div></article>
        </section>

        {notice && <div className={styles.notice} role="status"><CircleDot size={16} />{notice}<button onClick={() => setNotice("")} aria-label="Cerrar aviso"><X size={16} /></button></div>}

        <section className={styles.workspace}>
          <div className={styles.queuePanel}>
            <div className={styles.panelHeader}><div><h2>Pedidos</h2><p>{visibleOrders.length} en esta vista</p></div><button className={styles.refresh} onClick={() => void loadOrders(true)} disabled={refreshing} aria-label="Actualizar pedidos"><RefreshCw className={refreshing ? styles.spinning : ""} size={18} /></button></div>
            <div className={styles.search}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pedido o producto" aria-label="Buscar pedidos" /></div>
            <div className={styles.filters}>{FILTERS.map((item) => <button key={item.value} className={filter === item.value ? styles.filterActive : ""} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div>
            <div className={styles.orderList}>
              {visibleOrders.map((order) => <button key={order.id} className={`${styles.orderCard} ${effectiveSelectedId === order.id ? styles.orderCardSelected : ""}`} onClick={() => setSelectedId(order.id)}><div className={styles.orderCardTop}><strong>{order.pickup_code}</strong><span className={`${styles.status} ${styles[STATUS[order.status].tone]}`}><i />{STATUS[order.status].short}</span></div><p>{order.order_items.map((item) => `${item.quantity}× ${item.product_name}`).join(" · ") || "Sin artículos"}</p><div className={styles.orderCardBottom}><span>{formatTime(order.created_at)} · {itemCount(order)} artículos</span><strong>${Number(order.total).toFixed(2)}</strong><ChevronRight size={17} /></div></button>)}
              {visibleOrders.length === 0 && <div className={styles.empty}><ClipboardList size={30} /><strong>No hay pedidos aquí</strong><span>Los pedidos nuevos aparecerán automáticamente.</span></div>}
            </div>
          </div>

          <div className={styles.detailPanel}>{selected ? <OrderDetail order={selected} updating={updating} onUpdate={updateStatus} /> : <div className={styles.noSelection}><ClipboardList size={34} /><strong>Selecciona un pedido</strong><span>Aquí verás sus productos, notas y seguimiento.</span></div>}</div>
        </section>
      </main>
    </div>
  );
}

function OrderDetail({ order, updating, onUpdate }: { order: BusinessOrder; updating: boolean; onUpdate: (order: BusinessOrder, status: OrderStatus) => void }) {
  const next = nextStatus(order.status);
  const canCancel = order.status === "received" || order.status === "preparing";
  const timeline: OrderStatus[] = ["received", "preparing", "ready", "delivered"];
  const progress = timeline.indexOf(order.status);
  const subtotal = order.order_items.reduce((total, item) => total + Number(item.unit_price) * item.quantity, 0);
  const discount = Math.max(0, subtotal - Number(order.total));

  return (
    <div className={styles.detailInner}>
      <div className={styles.detailHeader}><div><p>PEDIDO</p><h2>{order.pickup_code}</h2><span>{formatDate(order.created_at)} · {formatTime(order.created_at)}</span></div><span className={`${styles.status} ${styles[STATUS[order.status].tone]}`}><i />{STATUS[order.status].label}</span></div>
      <div className={styles.timeline} aria-label="Progreso del pedido">
        {order.status === "cancelled" ? <div className={styles.cancelledMessage}><X size={18} /><div><strong>Pedido cancelado</strong><span>Este pedido ya no continúa en preparación.</span></div></div> : timeline.map((status, index) => { const complete = index < progress || order.status === "delivered"; const active = index === progress; return <div key={status} className={`${styles.step} ${complete ? styles.stepComplete : ""} ${active ? styles.stepActive : ""}`}><span>{complete ? <Check size={14} /> : index + 1}</span><p>{STATUS[status].short}</p>{index < timeline.length - 1 && <i />}</div>; })}
      </div>
      <section className={styles.detailSection}><div className={styles.detailSectionTitle}><h3>Artículos</h3><span>{itemCount(order)} en total</span></div><div className={styles.items}>{order.order_items.map((item) => { const options = item.selections.flatMap((selection) => selection.options.map((option) => option.name)).join(", "); return <div key={item.id} className={styles.item}><span className={styles.quantity}>{item.quantity}</span><div><strong>{item.product_name}</strong>{options && <p>{options}</p>}{item.notes && <small>Nota: {item.notes}</small>}</div><b>${(Number(item.unit_price) * item.quantity).toFixed(2)}</b></div>; })}</div></section>
      <section className={styles.summary}><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>{discount > 0 && <div className={styles.discount}><span>Promoción</span><strong>−${discount.toFixed(2)}</strong></div>}<div className={styles.total}><span>Total</span><strong>${Number(order.total).toFixed(2)}</strong></div></section>
      {(next || canCancel) && <div className={styles.detailActions}>{canCancel && <button className={styles.cancelButton} disabled={updating} onClick={() => onUpdate(order, "cancelled")}>Cancelar pedido</button>}{next && <button className={styles.primaryButton} disabled={updating} onClick={() => onUpdate(order, next)}>{updating ? <LoaderCircle className={styles.spinning} size={18} /> : null}{nextActionLabel(order.status)}</button>}</div>}
    </div>
  );
}
