"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Settings, X, Volume2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { BusinessOrder } from "@/lib/types";
import styles from "./panel-controls.module.css";

type Preferences = { theme: "light" | "dark" | "system"; sound: boolean; newOrders: boolean; cancellations: boolean; lateOrders: boolean; delayMinutes: number };
type Alert = { id: string; orderId: string; title: string; message: string; at: number; read: boolean; cancelled: boolean };
const DEFAULTS: Preferences = { theme: "system", sound: false, newOrders: true, cancellations: true, lateOrders: true, delayMinutes: 15 };

export function PanelControls({ orders, staffId, onOpenOrder }: { orders: BusinessOrder[]; staffId: string; onOpenOrder: (id: string) => void }) {
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [panel, setPanel] = useState<"notifications" | "settings" | null>(null);
  const [soundNotice, setSoundNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const seen = useRef(new Set<string>());
  const storageKey = `mascafe-panel-preferences:${staffId}`;

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
        if (saved && typeof saved === "object") {
          const next = { ...DEFAULTS };
          if (["light", "dark", "system"].includes(saved.theme)) next.theme = saved.theme;
          for (const key of ["sound", "newOrders", "cancellations", "lateOrders"] as const) {
            if (typeof saved[key] === "boolean") next[key] = saved[key];
          }
          if (Number.isInteger(saved.delayMinutes) && saved.delayMinutes >= 5 && saved.delayMinutes <= 120) next.delayMinutes = saved.delayMinutes;
          setPreferences(next);
        }
      } catch { /* La configuración funciona aunque el navegador bloquee almacenamiento. */ }
      setLoaded(true);
    });
    return () => { active = false; };
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch { /* Solo esta sesión. */ }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { document.documentElement.dataset.theme = preferences.theme === "system" ? (media.matches ? "dark" : "light") : preferences.theme; };
    apply();
    media.addEventListener("change", apply);
    return () => { media.removeEventListener("change", apply); delete document.documentElement.dataset.theme; };
  }, [preferences, loaded, storageKey]);

  useEffect(() => {
    const element = dialog.current;
    if (panel && element && !element.open) element.showModal();
    else if (!panel && element?.open) element.close();
  }, [panel]);

  useEffect(() => () => { void audio.current?.close(); }, []);

  const unlockSound = useCallback(async () => {
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      setSoundNotice(audio.current.state === "running" ? "Sonido listo en esta sesión." : "El navegador bloqueó el sonido. Vuelve a probar.");
    } catch { setSoundNotice("Este navegador no permite reproducir el aviso sonoro."); }
  }, []);

  const playSound = useCallback(() => {
    const context = audio.current;
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + .12);
    gain.gain.setValueAtTime(.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .35);
    oscillator.start(); oscillator.stop(context.currentTime + .36);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }, []);

  const notify = useCallback((alert: Omit<Alert, "at" | "read">) => {
    if (seen.current.has(alert.id)) return;
    if (seen.current.size > 2000) seen.current.clear();
    seen.current.add(alert.id);
    setAlerts((current) => [{ ...alert, at: Date.now(), read: false }, ...current].slice(0, 50));
    if (preferences.sound) playSound();
  }, [preferences.sound, playSound]);

  useEffect(() => {
    if (!loaded) return;
    const supabase = createClient();
    const channel = supabase.channel(`panel-alerts:${staffId}`).on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload: { eventType: string; new: Record<string, unknown> }) => {
      const record = payload.new as Partial<BusinessOrder>;
      if (!record.id) return;
      if (["ready", "delivered", "cancelled"].includes(record.status ?? "")) {
        setAlerts((current) => current.filter((alert) => !alert.id.startsWith(`${record.id}:late:`)));
      }
      if (payload.eventType === "INSERT" && preferences.newOrders && record.status !== "cancelled") notify({ id: `${record.id}:new`, orderId: record.id, title: "Nuevo pedido", message: `Pedido ${record.pickup_code ?? "nuevo"}: pendiente de atención.`, cancelled: false });
      if (payload.eventType === "UPDATE" && record.status === "cancelled" && preferences.cancellations) notify({ id: `${record.id}:cancelled`, orderId: record.id, title: "Pedido cancelado", message: `Pedido ${record.pickup_code ?? ""} cancelado. Ya no aparece en Operación.`, cancelled: true });
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loaded, preferences.newOrders, preferences.cancellations, notify, staffId]);

  useEffect(() => {
    if (!loaded) return;
    const check = () => {
      const pendingIds = new Set(orders.filter((order) => ["received", "preparing"].includes(order.status)).map((order) => order.id));
      setAlerts((current) => {
        const remaining = current.filter((alert) => !alert.id.startsWith(`${alert.orderId}:late:`) || pendingIds.has(alert.orderId));
        return remaining.length === current.length ? current : remaining;
      });
      if (!preferences.lateOrders) return;
      for (const order of orders) {
        if (pendingIds.has(order.id) && Date.now() - new Date(order.created_at).getTime() >= preferences.delayMinutes * 60_000) {
          notify({ id: `${order.id}:late:${preferences.delayMinutes}`, orderId: order.id, title: "Pedido con demora", message: `${order.pickup_code} lleva más de ${preferences.delayMinutes} minutos sin estar listo.`, cancelled: false });
        }
      }
    };
    const initial = window.setTimeout(check, 0);
    const timer = window.setInterval(check, 30_000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [orders, loaded, preferences.lateOrders, preferences.delayMinutes, notify]);

  const unread = alerts.filter((alert) => !alert.read).length;
  const markRead = () => setAlerts((current) => current
    .filter((alert) => alert.id.startsWith(`${alert.orderId}:late:`))
    .map((alert) => ({ ...alert, read: true })));
  const change = <K extends keyof Preferences>(key: K, value: Preferences[K]) => setPreferences((current) => ({ ...current, [key]: value }));
  return <>
    <div className={styles.buttons}>
      <button onClick={() => { setPanel("notifications"); if (preferences.sound) void unlockSound(); }} aria-label={`Notificaciones, ${unread} sin leer`}><Bell size={19} />{unread > 0 && <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>}</button>
      <button onClick={() => { setPanel("settings"); if (preferences.sound) void unlockSound(); }} aria-label="Configuración"><Settings size={19} /></button>
    </div>
    <dialog ref={dialog} className={styles.dialog} onCancel={() => setPanel(null)} onClick={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
      <div className={styles.content}>
        <header><div><h2>{panel === "notifications" ? "Notificaciones" : "Configuración"}</h2><p>{panel === "notifications" ? "Avisos de esta sesión del panel." : "Preferencias de tu cuenta en este navegador."}</p></div><button onClick={() => setPanel(null)} aria-label="Cerrar ventana" autoFocus><X size={20} /></button></header>
        {panel === "notifications" ? <>
          <div className={styles.notificationActions}><span>{unread} sin leer</span><button onClick={markRead} disabled={!unread}>Marcar todas como leídas</button></div>
          {alerts.some((alert) => alert.id.startsWith(`${alert.orderId}:late:`)) && <p className={styles.hint}>Los avisos de demora permanecen hasta que el pedido esté listo, entregado o cancelado, aunque ya estén leídos.</p>}
          {alerts.length === 0 && <p className={styles.empty}>No tienes notificaciones todavía.</p>}
          <div className={styles.alerts}>{alerts.map((alert) => <article key={alert.id} className={!alert.read ? styles.unread : ""}><strong>{alert.title}</strong><p>{alert.message}</p><small>{new Date(alert.at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</small><button onClick={() => {
            setAlerts((current) => current.flatMap((item) => item.id !== alert.id
              ? [item]
              : item.id.startsWith(`${item.orderId}:late:`) ? [{ ...item, read: true }] : []));
            if (!alert.cancelled) { onOpenOrder(alert.orderId); setPanel(null); }
          }}>{alert.cancelled ? "Marcar como leída" : "Ver pedido"}</button></article>)}</div>
        </> : <>
          <section className={styles.section}><h3>Apariencia</h3><div className={styles.themes}>{(["light", "dark", "system"] as const).map((theme) => <button key={theme} aria-pressed={preferences.theme === theme} onClick={() => change("theme", theme)}>{theme === "light" ? "Claro" : theme === "dark" ? "Oscuro" : "Automático"}</button>)}</div></section>
          <section className={styles.section}><h3>Alertas de pedidos</h3>{([
            ["newOrders", "Pedidos nuevos"], ["cancellations", "Cancelaciones"], ["lateOrders", "Pedidos con demora"], ["sound", "Aviso sonoro"],
          ] as const).map(([key, label]) => <label className={styles.toggle} key={key}><span>{label}</span><input type="checkbox" checked={preferences[key]} onChange={(event) => { change(key, event.target.checked); if (key === "sound" && event.target.checked) void unlockSound(); }} /></label>)}
          <label className={styles.delay}>Alertar después de<select value={preferences.delayMinutes} onChange={(event) => change("delayMinutes", Number(event.target.value))}>{[5, 10, 15, 20, 30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutos</option>)}</select></label>
          <button className={styles.testSound} onClick={async () => { await unlockSound(); playSound(); }}><Volume2 size={16} />Probar sonido</button><p className={styles.hint}>{soundNotice || "El navegador requiere un clic para habilitar sonido en cada sesión."}</p>
          </section><p className={styles.hint}>Cambios guardados automáticamente. Los avisos funcionan mientras el panel está abierto; no son notificaciones push.</p>
        </>}
      </div>
    </dialog>
  </>;
}
