"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { loadMenuCatalog } from '@/lib/menu-query';
import type { MenuProduct } from '@/lib/menu-types';
import { DAYS, type PromotionRow } from '@/lib/promotion-types';
import { savePromotion, deletePromotion } from '@/app/promotion-actions';
import styles from './menu-manager.module.css';
import { SuccessPopup } from './success-popup';

const money = (n: number) => `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)} MXN`;
export function PromotionManager({ canEdit }: { canEdit: boolean }) {
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [draft, setDraft] = useState<PromotionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<PromotionRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const revision = useRef(0);
  const [success, setSuccess] = useState('');
  const closeSuccess = useCallback(() => setSuccess(''), []);
  const load = useCallback(async () => {
    const startedAt = revision.current;
    setLoading(true);
    try {
      const [result, catalog] = await Promise.all([createClient().from('promotions').select('*').order('day').order('id'), loadMenuCatalog()]);
      if (result.error) throw new Error('No se pudieron cargar las promociones. Instala promotions-management.sql en Supabase.');
      if (startedAt === revision.current) setPromotions(result.data as PromotionRow[]);
      setProducts(catalog);
    } catch (e) { setNotice(e instanceof Error ? e.message : 'No se pudo cargar.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  useEffect(() => { if (draft || removing) dialog.current?.showModal(); else dialog.current?.close(); }, [draft, removing]);
  const close = () => { if (!busy) { setDraft(null); setRemoving(null); } };
  const subtotal = (p: PromotionRow) => p.requirements.reduce((s, r) => s + Number(products.find(item => item.id === r.productId)?.base_price ?? 0) * r.quantity, 0);
  const submit = async () => {
    setBusy(true); setNotice('');
    try {
      if (draft) {
        const saved = await savePromotion(draft, creating);
        revision.current++;
        setPromotions(current => (current.some(p => p.id === saved.id)
          ? current.map(p => p.id === saved.id ? saved : p)
          : [...current, saved]).sort((a, b) => a.day - b.day || a.id.localeCompare(b.id)));
        setSuccess(creating ? 'Promoción creada correctamente.' : 'Promoción actualizada correctamente.');
      } else if (removing) {
        await deletePromotion(removing.id, removing.updated_at);
        revision.current++;
        setPromotions(current => current.filter(p => p.id !== removing.id));
        setSuccess('Promoción eliminada correctamente.');
      }
      setDraft(null); setRemoving(null);
    } catch (e) { setNotice(e instanceof Error ? e.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  };
  return <section className={styles.root}>
    <SuccessPopup message={success} onClose={closeSuccess} />
    <div className={styles.toolbar}><div><h2>Promociones</h2><p>Combos, descuentos y vigencia por día. Los extras conservan su precio.</p></div><div className={styles.buttons}><button disabled={loading || busy} onClick={() => { void load(); }}><RefreshCw size={16} />Actualizar</button>{canEdit && <button className={styles.primary} onClick={() => { setNotice(''); setCreating(true); setDraft({ id: '', title: '', description: '', day: 2, discount: 15, active: true, requirements: [{ productId: products[0]?.id ?? '', quantity: 1 }], updated_at: '' }); }}><Plus size={16} />Nueva promoción</button>}</div></div>
    {notice && !draft && !removing && <p role="alert" className={styles.notice}>{notice}</p>}
    <div className={styles.filters}><input aria-label="Buscar promociones" placeholder="Buscar promociones…" value={query} onChange={e => setQuery(e.target.value)} /></div>
    {loading && !promotions.length ? <p>Cargando promociones…</p> : <div className={styles.grid}>{promotions.filter(p => p.title.toLocaleLowerCase('es-MX').includes(query.toLocaleLowerCase('es-MX'))).map(p => <article key={p.id} className={styles.card}><div className={styles.cardBody}><div className={styles.row}><span className={styles.available}>{DAYS[p.day]}</span><span className={p.active ? styles.available : styles.hidden}>{p.active ? 'Activa' : 'Desactivada'}</span></div><h3>{p.title}</h3><p>{p.description}</p>{p.requirements.map(r => <div key={r.productId}>{r.quantity} × {products.find(item => item.id === r.productId)?.name ?? 'Artículo eliminado'}</div>)}<p>Descuento: {money(Number(p.discount))}</p><strong>Combo: {money(Math.max(0, subtotal(p) - Number(p.discount)))}</strong>{canEdit && <div className={styles.buttons}><button onClick={() => { setCreating(false); setNotice(''); setDraft(structuredClone(p)); }}><Pencil size={16} />Editar</button><button aria-label={`Eliminar ${p.title}`} className={styles.danger} onClick={() => { setNotice(''); setRemoving(p); }}><Trash2 size={16} /></button></div>}</div></article>)}</div>}
    {!loading && !promotions.length && !notice && <p className={styles.empty}>Todavía no hay promociones.</p>}
    <dialog ref={dialog} className={styles.dialog} onCancel={e => { if (busy) e.preventDefault(); else close(); }}><button className={styles.close} disabled={busy} aria-label="Cerrar" onClick={close}><X size={18} /></button><h2>{removing ? 'Eliminar promoción' : creating ? 'Nueva promoción' : 'Editar promoción'}</h2>
      {removing ? <p>¿Eliminar “{removing.title}”? Los pedidos anteriores conservarán su total.</p> : draft && <form id="promotion-form" className={styles.form} onSubmit={e => { e.preventDefault(); void submit(); }}><fieldset disabled={busy}><label>Nombre<input required maxLength={120} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label><label>Descripción<textarea maxLength={500} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label><div className={styles.fields}><label>Día válido<select value={draft.day} onChange={e => setDraft({ ...draft, day: Number(e.target.value) })}>{DAYS.map((day, i) => <option key={day} value={i}>{day}</option>)}</select></label><label>Descuento por combo (MXN)<input type="number" min="0.01" max={subtotal(draft)} step="0.01" required value={draft.discount} onChange={e => setDraft({ ...draft, discount: Number(e.target.value) })} /></label></div><label className={styles.checkbox}><input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} />Promoción activa</label><h3>Artículos del combo</h3>{draft.requirements.map((r, i) => <div className={styles.option} key={i}><label>Artículo<select required value={r.productId} onChange={e => setDraft({ ...draft, requirements: draft.requirements.map((item, index) => index === i ? { ...item, productId: e.target.value } : item) })}><option value="">Selecciona</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Cantidad<input type="number" min={1} max={3} required value={r.quantity} onChange={e => setDraft({ ...draft, requirements: draft.requirements.map((item, index) => index === i ? { ...item, quantity: Number(e.target.value) } : item) })} /></label><button type="button" aria-label="Quitar artículo" disabled={draft.requirements.length === 1} onClick={() => setDraft({ ...draft, requirements: draft.requirements.filter((_, index) => index !== i) })}><Trash2 size={16} /></button></div>)}<button type="button" disabled={draft.requirements.length >= 3} onClick={() => setDraft({ ...draft, requirements: [...draft.requirements, { productId: '', quantity: 1 }] })}><Plus size={16} />Artículo</button><p>Precio del combo: {money(Math.max(0, subtotal(draft) - draft.discount))}. Máximo 3 artículos por pedido. Promociones superpuestas: se aplica la combinación de mayor ahorro, sin duplicar descuentos.</p></fieldset></form>}
      {notice && <p role="alert" className={styles.error}>{notice}</p>}<div className={styles.footer}><button disabled={busy} onClick={close}>Cancelar</button>{removing ? <button disabled={busy} className={styles.danger} onClick={() => { void submit(); }}>Eliminar</button> : <button disabled={busy} className={styles.primary} type="submit" form="promotion-form">{busy ? 'Guardando…' : 'Guardar promoción'}</button>}</div>
    </dialog>
  </section>;
}
