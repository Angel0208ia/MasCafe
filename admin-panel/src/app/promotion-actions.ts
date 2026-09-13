"use server";

import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import type { PromotionRow } from '@/lib/promotion-types';

async function authorize() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Inicia sesión nuevamente.');
  const { data } = await db.from('staff_members').select('role,active').eq('user_id', user.id).single();
  if (!data?.active || data.role !== 'admin') throw new Error('Solo un administrador puede configurar promociones.');
  return db;
}

export async function savePromotion(input: PromotionRow, creating: boolean) {
  const db = await authorize();
  if (!creating && (typeof input?.id !== 'string' || !input.id || input.id.length > 100 || typeof input.updated_at !== 'string' || !input.updated_at))
    throw new Error('Promoción inválida.');
  if (typeof creating !== 'boolean' || !input || typeof input.title !== 'string' || !input.title.trim() || input.title.length > 120 ||
      typeof input.description !== 'string' || input.description.length > 500 || typeof input.active !== 'boolean' ||
      !Number.isInteger(input.day) || input.day < 0 || input.day > 6 ||
      !Number.isFinite(input.discount) || input.discount <= 0 || input.discount > 999999 || Math.abs(input.discount * 100 - Math.round(input.discount * 100)) > .00001 ||
      !Array.isArray(input.requirements) || !input.requirements.length || input.requirements.length > 3)
    throw new Error('Revisa los datos de la promoción.');
  const ids = new Set<string>();
  let quantity = 0;
  for (const r of input.requirements) {
    if (!r || typeof r.productId !== 'string' || r.productId.length > 100 || ids.has(r.productId) || !Number.isInteger(r.quantity) || r.quantity < 1 || r.quantity > 3)
      throw new Error('Selecciona artículos distintos y cantidades válidas.');
    ids.add(r.productId); quantity += r.quantity;
  }
  if (quantity > 3) throw new Error('El combo puede tener máximo 3 artículos.');
  const { data: products, error } = await db.from('products').select('id,base_price').in('id', [...ids]);
  if (error || products?.length !== ids.size) throw new Error('Uno de los artículos ya no existe.');
  const subtotal = input.requirements.reduce((sum, r) => sum + Number(products.find(p => p.id === r.productId)!.base_price) * r.quantity, 0);
  if (input.discount > subtotal) throw new Error('El descuento no puede superar el precio del combo.');
  const values = { title: input.title.trim(), description: input.description.trim(), day: input.day, discount: input.discount, active: input.active, requirements: input.requirements.map(r => ({ productId: r.productId, quantity: r.quantity })), updated_at: new Date().toISOString() };
  const result = creating
    ? await db.from('promotions').insert({ ...values, id: randomUUID() }).select('id').single()
    : await db.from('promotions').update(values).eq('id', input.id).eq('updated_at', input.updated_at).select('id').maybeSingle();
  if (result.error) throw new Error('No se pudo guardar la promoción. Verifica la migración promotions-management.sql.');
  if (!result.data) throw new Error('La promoción cambió. Actualiza e intenta nuevamente.');
}

export async function deletePromotion(id: string, revision: string) {
  const db = await authorize();
  if (typeof id !== 'string' || !id || id.length > 100 || typeof revision !== 'string') throw new Error('Promoción inválida.');
  const { data, error } = await db.from('promotions').delete().eq('id', id).eq('updated_at', revision).select('id').maybeSingle();
  if (error || !data) throw new Error('No se pudo eliminar. Actualiza e intenta nuevamente.');
}
