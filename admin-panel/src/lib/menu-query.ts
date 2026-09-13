import { createClient } from './supabase/client';
import type { MenuProduct } from './menu-types';

// Solo lectura del catálogo ya público bajo RLS. Las escrituras siguen en servidor.
export async function loadMenuCatalog(): Promise<MenuProduct[]> {
  const db = createClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const products: MenuProduct[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db.from('products')
        .select('id,name,description,image,category,base_price,available,customizations,updated_at')
        .order('id').range(offset, offset + 499).abortSignal(controller.signal);
      if (error) throw new Error('No se pudo cargar el menú. Intenta actualizar nuevamente.');
      products.push(...data as MenuProduct[]);
      if (data.length < 500) return products;
    }
  } finally { clearTimeout(timeout); }
}
