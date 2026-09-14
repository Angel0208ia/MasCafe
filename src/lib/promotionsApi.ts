import { getSupabaseClient } from './supabase';
import { PROMOTIONS, setPromotions, type Promotion } from '../constants/promotions';
import type { Product } from '../types/product';

const days = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
export async function refreshPromotions(products: Product[]): Promise<readonly Promotion[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('promotions').select('id,title,description,day,discount,requirements').eq('active',true).order('day').order('id');
  if (error) {
    // Mantiene la versión anterior hasta instalar la migración o recuperar conexión.
    return PROMOTIONS;
  }
  const next: Promotion[] = (data ?? []).filter(p => p.requirements.every((r: {productId: string}) => products.some(product => product.id === r.productId && product.available))).map(p => {
    const total = p.requirements.reduce((sum: number, r: { productId: string; quantity: number }) => sum + (products.find(product => product.id === r.productId)?.price ?? 0) * r.quantity, 0);
    return { id: p.id, title: p.title, description: p.description, day: p.day, dayLabel: days[p.day], discountPerBundle: Number(p.discount), requirements: p.requirements,
      priceLabel: `Combo por $${Math.max(0,total - Number(p.discount)).toFixed(2)}`, accentColor: '#607C45', softColor: '#E9F0E3' };
  });
  if (JSON.stringify(next) !== JSON.stringify(PROMOTIONS)) setPromotions(next);
  return PROMOTIONS;
}
