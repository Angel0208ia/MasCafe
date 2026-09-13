import { supabase } from './supabase';

export type WeeklyBestSeller = { product_id: string; quantity: number };
let cached: WeeklyBestSeller[] = [];
let refreshedAt = 0;
let pending: Promise<WeeklyBestSeller[]> | null = null;

/** Ranking pequeño compartido; no vuelve a consultar en cada refresco del menú. */
export function loadWeeklyBestSellers(): Promise<WeeklyBestSeller[]> {
  if (pending) return pending;
  if (Date.now() - refreshedAt < 60_000) return Promise.resolve(cached);
  pending = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const { data, error } = await supabase.rpc('get_weekly_best_sellers').abortSignal(controller.signal);
      if (error) throw error;
      const next = (data ?? []) as WeeklyBestSeller[];
      if (JSON.stringify(next) !== JSON.stringify(cached)) cached = next;
      return cached;
    } finally {
      clearTimeout(timeout);
      refreshedAt = Date.now();
    }
  })().finally(() => { pending = null; });
  return pending;
}
