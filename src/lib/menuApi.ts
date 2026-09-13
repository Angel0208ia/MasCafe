import type { CustomizationGroup, Product } from '../types/product';
import { getProductImage } from '../constants/productImages';
import { supabase } from './supabase';

type ProductRow = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  base_price: number | string;
  available: boolean;
  customizations: CustomizationGroup[] | null;
};

let cachedMenu: Product[] | undefined;
let cachedRevision = '';

export async function fetchMenu(): Promise<Product[]> {
  // Una revisión pequeña evita descargar fotos, descripciones y opciones cada vez.
  const revision = await supabase.from('products').select('id, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false }).order('id').limit(1);
  if (revision.error) throw revision.error;
  const key = JSON.stringify([revision.count, revision.data]);
  if (cachedMenu && key === cachedRevision) return cachedMenu;
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, image, category, base_price, available, customizations')
    .order('category')
    .order('name');

  if (error) throw error;

  const products = ((data ?? []) as ProductRow[]).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    image: getProductImage(product.id, product.image),
    category: product.category,
    price: Number(product.base_price),
    available: product.available,
    customizations: product.customizations ?? [],
  }));
  cachedMenu = products;
  cachedRevision = key;
  return products;
}
