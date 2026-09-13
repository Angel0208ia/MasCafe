"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ImagePlus,
  RefreshCw,
} from "lucide-react";
import {
  deleteMenuProduct,
  saveMenuProduct,
  setMenuAvailability,
} from "@/app/menu-actions";
import type { MenuGroup, MenuProduct } from "@/lib/menu-types";
import styles from "./menu-manager.module.css";
import { loadMenuCatalog } from '@/lib/menu-query';
import { filterMenuByName } from '@/lib/menu-search';

const money = (v: number | string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(v),
  );
async function optimizeImage(file: File): Promise<File> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("Selecciona una foto JPG, PNG o WebP de hasta 10 MB.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("No se pudo abrir la foto. Prueba con otra imagen.");
  });
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Este navegador no permite procesar imágenes.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    if (!blob || blob.type !== "image/webp" || blob.size > 2097152)
      throw new Error("La foto es demasiado pesada. Selecciona otra.");
    return new File([blob], "producto.webp", { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}

export function MenuManager({ canEdit, active = true }: { canEdit: boolean; active?: boolean }) {
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingRequest = useRef<Promise<void> | null>(null);
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("all");
  const [editing, setEditing] = useState<MenuProduct | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<MenuProduct | null>(null);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  async function toggleAvailability(product: MenuProduct) {
    if (togglingId) return;
    setTogglingId(product.id);
    try {
      const result = await setMenuAvailability(
        product.id,
        !product.available,
        product.updated_at,
      );
      if (result.product)
        setProducts((current) =>
          current.map((p) => (p.id === product.id ? result.product! : p)),
        );
      if (result.error) setNotice(result.error);
    } catch {
      setNotice("No se pudo cambiar la disponibilidad. Intenta nuevamente.");
    } finally {
      setTogglingId("");
    }
  }
  const load = useCallback(() => {
    if (loadingRequest.current) return loadingRequest.current;
    loadingRequest.current = (async () => {
    setLoading(true);
    try {
      const result = await loadMenuCatalog();
      setProducts(result);
    } catch {
      setNotice("No se pudo conectar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
    })().finally(() => { loadingRequest.current = null; });
    return loadingRequest.current;
  }, []);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load, active]);
  const categories = [...new Set(products.map((p) => p.category))].sort();
  const visible = filterMenuByName(products.filter(
    (p) =>
      (!category || p.category === category) &&
      (availability === "all" ||
        p.available === (availability === "available")),
  ), query);
  const pages = Math.max(1, Math.ceil(visible.length / 12));
  const currentPage = Math.min(page, pages - 1);
  const pageProducts = visible.slice(currentPage * 12, (currentPage + 1) * 12);
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      const result = await deleteMenuProduct(deleting.id, deleting.updated_at);
      if (result.error) setNotice(result.error);
      else {
        setDeleting(null);
        setNotice("Artículo eliminado. El historial de pedidos se conserva.");
        if (loadingRequest.current) await loadingRequest.current;
        await load();
      }
    } catch {
      setNotice("No se pudo eliminar. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <h2>Catálogo</h2>
          <p>{products.length} artículos · Precios en pesos mexicanos</p>
        </div>
        <div className={styles.buttons}>
          <button onClick={() => void load()} disabled={loading}>
            <RefreshCw size={17} />
            Actualizar
          </button>
          {canEdit && (
            <button className={styles.primary} onClick={() => setEditing(null)}>
              <Plus size={18} />
              Nuevo artículo
            </button>
          )}
        </div>
      </div>
      {!canEdit && (
        <p className={styles.notice}>
          Puedes consultar el catálogo. Solo los administradores pueden
          modificarlo.
        </p>
      )}
      {notice && (
        <div className={styles.notice} role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      )}
      <div className={styles.filters}>
        <label className={styles.search}>
          <Search size={18} />
          <input
            placeholder="Buscar artículos"
            aria-label="Buscar artículos"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          />
        </label>
        <select
          aria-label="Categoría"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(0); }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Disponibilidad"
          value={availability}
          onChange={(e) => { setAvailability(e.target.value); setPage(0); }}
        >
          <option value="all">Todos los artículos</option>
          <option value="available">Disponibles</option>
          <option value="hidden">No disponibles</option>
        </select>
      </div>
      {loading && products.length === 0 ? (
        <p role="status">Cargando menú…</p>
      ) : (
        <div className={styles.grid}>
          {pageProducts.map((p) => (
            <article className={styles.card} key={p.id}>
              <ProductPhoto image={p.image} name={p.name} />
              <div className={styles.cardBody}>
                <small>{p.category}</small>
                <h3>{p.name}</h3>
                <p>{p.description || "Sin descripción"}</p>
                <div className={styles.row}>
                  <strong>{money(p.base_price)} MXN</strong>
                  {canEdit ? (
                    <button
                      className={
                        p.available
                          ? styles.availabilityOn
                          : styles.availabilityOff
                      }
                      disabled={!!togglingId}
                      aria-pressed={p.available}
                      aria-label={`${p.name}: ${p.available ? "disponible, marcar como no disponible" : "no disponible, marcar como disponible"}`}
                      onClick={() => void toggleAvailability(p)}
                    >
                      {togglingId === p.id
                        ? "Guardando…"
                        : p.available
                          ? "Disponible"
                          : "No disponible"}
                    </button>
                  ) : (
                    <span
                      className={p.available ? styles.available : styles.hidden}
                    >
                      {p.available ? "Disponible" : "No disponible"}
                    </span>
                  )}
                </div>
                <small>
                  {p.customizations?.length ?? 0} grupos de opciones
                </small>
                {canEdit && (
                  <div className={styles.buttons}>
                    <button onClick={() => setEditing(p)}>
                      <Pencil size={16} />
                      Editar
                    </button>
                    <button
                      className={styles.danger}
                      onClick={() => setDeleting(p)}
                      aria-label={`Eliminar ${p.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && visible.length === 0 && (
        <p className={styles.empty}>No hay artículos en esta vista.</p>
      )}
      {visible.length > 12 && <div className={styles.buttons} style={{ marginTop: 20 }}><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Anterior</button><span>Página {currentPage + 1} de {pages} · {visible.length} artículos</span><button disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Siguiente</button></div>}
      {editing !== undefined && (
        <ProductEditor
          key={editing?.id ?? "new"}
          product={editing}
          categories={categories}
          onClose={() => setEditing(undefined)}
          onSaved={async () => {
            setEditing(undefined);
            setNotice("Artículo guardado en el menú del cliente.");
            if (loadingRequest.current) await loadingRequest.current;
            await load();
          }}
        />
      )}
      {deleting && (
        <CenteredDialog
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <h2>¿Eliminar {deleting.name}?</h2>
          <p>
            Se quitará del menú y de las promociones que lo necesiten. Los
            pedidos anteriores se conservarán. Puedes marcarlo como no
            disponible en lugar de eliminarlo.
          </p>
          <div className={styles.buttons}>
            <button disabled={busy} onClick={() => setDeleting(null)}>
              Volver
            </button>
            <button
              disabled={busy}
              className={styles.danger}
              onClick={() => void remove()}
            >
              {busy ? "Eliminando…" : "Eliminar artículo"}
            </button>
          </div>
        </CenteredDialog>
      )}
    </section>
  );
}

function ProductPhoto({ image, name }: { image: string; name: string }) {
  const [failedImage, setFailedImage] = useState('');
  // Las fotos ya se optimizan al subirlas; también admite vistas previas blob locales.
  return (
    <div className={styles.photo}>
      {image && failedImage !== image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          loading="lazy"
          decoding="async"
          width={480}
          height={360}
          onError={() => setFailedImage(image)}
        />
      ) : (
        <>
          <ImagePlus size={28} />
          <span>Sin imagen</span>
        </>
      )}
    </div>
  );
}
function CenteredDialog({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Configuración de artículo"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <button className={styles.close} onClick={onClose} aria-label="Cerrar">
        <X size={20} />
      </button>
      {children}
    </dialog>
  );
}
function ProductEditor({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: MenuProduct | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [groups, setGroups] = useState<MenuGroup[]>(
    (product?.customizations ?? []).map((g) => ({
      ...g,
      required: !!g.required,
      minSelections: g.minSelections ?? (g.required ? 1 : 0),
      maxSelections:
        g.maxSelections ?? (g.type === "single" ? 1 : g.options.length),
      options: g.options.map((o) => ({ ...o })),
    })),
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const changeFile = (next: File | null) => {
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : "");
  };
  const updateGroup = (index: number, patch: Partial<MenuGroup>) =>
    setGroups((current) =>
      current.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    data.set("id", product?.id ?? "");
    data.set("updated_at", product?.updated_at ?? "");
    data.set("available", data.get("available") === "on" ? "true" : "false");
    data.set("customizations", JSON.stringify(groups));
    data.set("removeImage", String(removeImage));
    if (file) data.set("image", file);
    try {
      const result = await saveMenuProduct(data);
      if (result.error) setError(result.error);
      else await onSaved();
    } catch {
      setError("No se pudo guardar. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <CenteredDialog
      onClose={() => {
        if (!busy && !processing) onClose();
      }}
    >
      <h2>{product ? "Editar artículo" : "Nuevo artículo"}</h2>
      <p>Configura cómo aparece y se personaliza en el menú del cliente.</p>
      <form className={styles.form} onSubmit={submit}>
        <fieldset disabled={busy || processing}>
          <div className={styles.fields}>
            <label>
              Nombre
              <input
                name="name"
                defaultValue={product?.name}
                required
                maxLength={120}
              />
            </label>
            <label>
              Categoría
              <input
                name="category"
                list="menu-categories"
                defaultValue={product?.category}
                required
                maxLength={80}
              />
              <datalist id="menu-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label>
              Precio base (MXN)
              <input
                name="price"
                type="number"
                min="0"
                max="999999.99"
                step="0.01"
                required
                defaultValue={product?.base_price}
              />
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                name="available"
                defaultChecked={product?.available ?? true}
              />
              Disponible en el menú
            </label>
          </div>
          <label>
            Descripción
            <textarea
              name="description"
              defaultValue={product?.description}
              maxLength={1500}
              rows={3}
            />
          </label>
          <div className={styles.upload}>
            <ProductPhoto
              key={preview || String(removeImage)}
              image={preview || (removeImage ? "" : (product?.image ?? ""))}
              name="Vista previa"
            />
            <div>
              <label>
                Foto del dispositivo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    const selected = e.target.files?.[0];
                    if (!selected) return;
                    setProcessing(true);
                    setError("");
                    try {
                      changeFile(await optimizeImage(selected));
                      setRemoveImage(false);
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "No se pudo procesar la foto.",
                      );
                    } finally {
                      setProcessing(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
              <p>
                JPG, PNG o WebP hasta 10 MB. Se optimiza a WebP de máximo 1200
                px.
              </p>
              {file && (
                <small>
                  Lista para subir: {Math.ceil(file.size / 1024)} KB
                </small>
              )}
              {(file || product?.image) && (
                <button
                  type="button"
                  onClick={() => {
                    changeFile(null);
                    setRemoveImage(true);
                  }}
                >
                  Quitar foto
                </button>
              )}
            </div>
          </div>
          <div className={styles.row}>
            <h3>Opciones del pedido</h3>
            <button
              type="button"
              disabled={groups.length >= 12}
              onClick={() =>
                setGroups((current) => [
                  ...current,
                  {
                    id: crypto.randomUUID(),
                    name: "",
                    type: "single",
                    required: false,
                    minSelections: 0,
                    maxSelections: 1,
                    options: [
                      { id: crypto.randomUUID(), name: "", extraPrice: 0 },
                    ],
                  },
                ])
              }
            >
              <Plus size={16} />
              Grupo
            </button>
          </div>
          {groups.map((g, i) => (
            <section className={styles.group} key={g.id}>
              <div className={styles.row}>
                <strong>Grupo {i + 1}</strong>
                <button
                  type="button"
                  aria-label="Eliminar grupo"
                  onClick={() =>
                    setGroups((current) => current.filter((_, j) => i !== j))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className={styles.fields}>
                <label>
                  Nombre del grupo
                  <input
                    required
                    maxLength={100}
                    value={g.name}
                    onChange={(e) => updateGroup(i, { name: e.target.value })}
                  />
                </label>
                <label>
                  Selección
                  <select
                    value={g.type}
                    onChange={(e) =>
                      updateGroup(i, {
                        type: e.target.value as MenuGroup["type"],
                        maxSelections: 1,
                        minSelections: g.required ? 1 : 0,
                      })
                    }
                  >
                    <option value="single">Una opción</option>
                    <option value="multiple">Varias opciones</option>
                  </select>
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={g.required}
                    onChange={(e) =>
                      updateGroup(i, {
                        required: e.target.checked,
                        minSelections: e.target.checked
                          ? Math.max(1, g.minSelections)
                          : 0,
                      })
                    }
                  />
                  Obligatorio
                </label>
                {g.type === "multiple" && (
                  <>
                    <label>
                      Mínimo
                      <input
                        type="number"
                        min={g.required ? 1 : 0}
                        max={g.options.length}
                        value={g.minSelections}
                        onChange={(e) =>
                          updateGroup(i, {
                            minSelections: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Máximo
                      <input
                        type="number"
                        min="1"
                        max={g.options.length}
                        value={g.maxSelections}
                        onChange={(e) =>
                          updateGroup(i, {
                            maxSelections: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </>
                )}
              </div>
              {g.options.map((o, j) => (
                <div className={styles.option} key={o.id}>
                  <label>
                    Opción
                    <input
                      required
                      maxLength={100}
                      value={o.name}
                      onChange={(e) =>
                        updateGroup(i, {
                          options: g.options.map((v, k) =>
                            j === k ? { ...v, name: e.target.value } : v,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Extra (MXN)
                    <input
                      type="number"
                      min="0"
                      max="999999.99"
                      step="0.01"
                      required
                      value={o.extraPrice}
                      onChange={(e) =>
                        updateGroup(i, {
                          options: g.options.map((v, k) =>
                            j === k
                              ? { ...v, extraPrice: Number(e.target.value) }
                              : v,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    disabled={g.options.length <= 1}
                    aria-label="Quitar opción"
                    onClick={() =>
                      updateGroup(i, {
                        options: g.options.filter((_, k) => j !== k),
                        maxSelections: Math.min(
                          g.maxSelections,
                          g.options.length - 1,
                        ),
                        minSelections: Math.min(
                          g.minSelections,
                          g.options.length - 1,
                        ),
                      })
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={g.options.length >= 30}
                onClick={() =>
                  updateGroup(i, {
                    options: [
                      ...g.options,
                      { id: crypto.randomUUID(), name: "", extraPrice: 0 },
                    ],
                  })
                }
              >
                <Plus size={16} />
                Añadir opción
              </button>
            </section>
          ))}
        </fieldset>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.footer}>
          <button type="button" disabled={busy || processing} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.primary}
            disabled={busy || processing}
          >
            {processing
              ? "Optimizando foto…"
              : busy
                ? "Guardando…"
                : "Guardar artículo"}
          </button>
        </div>
      </form>
    </CenteredDialog>
  );
}
