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

export async function fetchMenu(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, image, category, base_price, available, customizations')
    .eq('available', true)
    .order('category')
    .order('name');

  if (error) throw error;

  return ((data ?? []) as ProductRow[]).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    image: getProductImage(product.id, product.image),
    category: product.category,
    price: Number(product.base_price),
    available: product.available,
    customizations: product.customizations ?? [],
  }));
}
