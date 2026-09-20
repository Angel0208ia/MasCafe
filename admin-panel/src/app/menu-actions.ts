"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MenuGroup, MenuProduct } from "@/lib/menu-types";

async function authorize(write = false) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("Inicia sesión nuevamente.");
  const { data } = await db
    .from("staff_members")
    .select("role, active")
    .eq("user_id", user.id)
    .single();
  if (!data?.active || (write && data.role !== "admin"))
    throw new Error("Solo un administrador puede configurar el menú.");
  return db;
}
function text(form: FormData, key: string, max: number, required = false) {
  const value = form.get(key);
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (required && !value.trim())
  )
    throw new Error("Revisa los campos del artículo.");
  return value.trim();
}
function price(value: unknown) {
  const n =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : NaN;
  if (
    !Number.isFinite(n) ||
    n < 0 ||
    n > 999999.99 ||
    Math.abs(n * 100 - Math.round(n * 100)) > 0.00001
  )
    throw new Error("El precio debe ser positivo y tener hasta dos decimales.");
  return n;
}
function groups(raw: string): MenuGroup[] {
  const list = JSON.parse(raw) as MenuGroup[];
  if (!Array.isArray(list) || list.length > 12)
    throw new Error("Máximo 12 grupos de opciones.");
  const ids = new Set<string>();
  const label = (v: unknown, max: number) => {
    if (typeof v !== "string" || !v.trim() || v.length > max)
      throw new Error(
        "Completa los nombres e identificadores de las opciones.",
      );
    return v.trim();
  };
  return list.map((g) => {
    if (!g || typeof g !== "object")
      throw new Error("Grupo de opciones inválido.");
    const id = label(g.id, 100);
    if (ids.has(id)) throw new Error("Hay grupos repetidos.");
    ids.add(id);
    if (
      !["single", "multiple"].includes(g.type) ||
      !Array.isArray(g.options) ||
      !g.options.length ||
      g.options.length > 30 ||
      typeof g.required !== "boolean"
    )
      throw new Error("Revisa las opciones del producto.");
    const optionIds = new Set<string>();
    const options = g.options.map((o) => {
      if (!o || typeof o !== "object") throw new Error("Opción inválida.");
      const optionId = label(o.id, 100);
      if (optionIds.has(optionId)) throw new Error("Hay opciones repetidas.");
      optionIds.add(optionId);
      return {
        id: optionId,
        name: label(o.name, 100),
        extraPrice: price(o.extraPrice),
      };
    });
    const min = g.minSelections ?? (g.required ? 1 : 0),
      max = g.maxSelections ?? (g.type === "single" ? 1 : options.length);
    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max < Math.max(1, min) ||
      max > options.length ||
      (g.required && min < 1) ||
      (g.type === "single" && max !== 1)
    )
      throw new Error("Revisa el mínimo y máximo de selecciones.");
    return {
      id,
      name: label(g.name, 100),
      type: g.type,
      required: g.required,
      minSelections: min,
      maxSelections: max,
      options,
    };
  });
}
function managedPath(url: string) {
  try {
    const base = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
        process.env.EXPO_PUBLIC_SUPABASE_URL ??
        "",
    );
    const image = new URL(url);
    const prefix = "/storage/v1/object/public/menu-images/";
    const path = image.pathname.slice(prefix.length);
    return image.origin === base.origin &&
      image.pathname.startsWith(prefix) &&
      /^[a-f0-9-]+\.webp$/.test(path)
      ? path
      : null;
  } catch {
    return null;
  }
}
export async function listMenu(): Promise<{
  products?: MenuProduct[];
  error?: string;
}> {
  try {
    const db = await authorize();
    const products: MenuProduct[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db
        .from("products")
        .select("*")
        .order("id")
        .range(offset, offset + 499);
      if (error) throw new Error("No se pudo cargar el menú.");
      products.push(...(data as MenuProduct[]));
      if (data.length < 500) break;
    }
    return { products };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudo cargar el menú.",
    };
  }
}
export async function saveMenuProduct(form: FormData) {
  let uploaded: string | null = null;
  const db = await authorize(true).catch(() => null);
  if (!db)
    return { error: "Solo un administrador activo puede guardar artículos." };
  try {
    const existingId = text(form, "id", 100);
    const id = existingId || randomUUID();
    const record = {
      name: text(form, "name", 120, true),
      description: text(form, "description", 1500),
      category: text(form, "category", 80, true),
      base_price: price(text(form, "price", 20, true)),
      active: form.get("active") === "true",
      available: form.get("available") === "true",
      customizations: groups(text(form, "customizations", 60000, true)),
      updated_at: new Date().toISOString(),
    };
    let previous: MenuProduct | null = null;
    if (existingId) {
      const { data, error } = await db
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) throw new Error("El artículo ya no existe.");
      previous = data as MenuProduct;
      if (previous.updated_at !== text(form, "updated_at", 60))
        throw new Error(
          "Otro administrador modificó este artículo. Actualiza el menú antes de editarlo.",
        );
    }
    let image =
      form.get("removeImage") === "true" ? "" : (previous?.image ?? "");
    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      if (file.size > 2097152 || file.type !== "image/webp")
        throw new Error(
          "La imagen optimizada debe ser WebP y pesar menos de 2 MB.",
        );
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (
        String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" ||
        String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP"
      )
        throw new Error("El archivo no es una imagen WebP válida.");
      const path = `${randomUUID()}.webp`;
      const { error } = await db.storage
        .from("menu-images")
        .upload(path, bytes, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });
      if (error)
        throw new Error(
          "No se pudo subir la foto. Verifica que menu-management.sql esté instalado en Supabase.",
        );
      uploaded = path;
      image = db.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
    }
    const operation = previous
      ? db
          .from("products")
          .update({ ...record, image })
          .eq("id", id)
          .eq("updated_at", previous.updated_at)
      : db.from("products").insert({ ...record, id, image });
    const { data, error } = await operation.select("*");
    if (error || !data?.length)
      throw new Error(
        "No se pudo guardar. Actualiza el menú y verifica los permisos de menu-management.sql.",
      );
    const oldPath =
      previous && previous.image !== image ? managedPath(previous.image) : null;
    // Una vez guardado, nunca borrar la nueva foto si falla la limpieza anterior.
    uploaded = null;
    if (oldPath) after(async () => {
      await db.storage.from("menu-images").remove([oldPath]).catch(() => undefined);
    });
    return { product: data[0] as MenuProduct };
  } catch (e) {
    if (uploaded) {
      const path = uploaded;
      after(async () => { await db.storage.from("menu-images").remove([path]).catch(() => undefined); });
    }
    return {
      error: e instanceof Error ? e.message : "No se pudo guardar el artículo.",
    };
  }
}
export async function deleteMenuProduct(id: string, updatedAt: string) {
  try {
    const db = await authorize(true);
    if (
      typeof id !== "string" ||
      id.length > 100 ||
      typeof updatedAt !== "string"
    )
      throw new Error("Artículo inválido.");
    const { data, error } = await db
      .from("products")
      .delete()
      .eq("id", id)
      .eq("updated_at", updatedAt)
      .select("image");
    if (error || !data?.length)
      throw new Error(
        "No se pudo eliminar. Actualiza el menú y verifica los permisos.",
      );
    const path = managedPath(data[0].image);
    if (path) after(async () => {
      await db.storage.from("menu-images").remove([path]).catch(() => undefined);
    });
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo eliminar." };
  }
}

export async function setMenuAvailability(
  id: string,
  available: boolean,
  updatedAt: string,
) {
  try {
    const db = await authorize(true);
    if (
      typeof id !== "string" ||
      !id ||
      id.length > 100 ||
      typeof available !== "boolean" ||
      typeof updatedAt !== "string"
    )
      throw new Error("Artículo inválido.");
    const { data, error } = await db
      .from("products")
      .update({ available, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("updated_at", updatedAt)
      .select("*")
      .single();
    if (error || !data)
      throw new Error(
        "No se pudo cambiar la disponibilidad. Actualiza el menú y vuelve a intentar.",
      );
    return { product: data as MenuProduct };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "No se pudo cambiar la disponibilidad.",
    };
  }
}
