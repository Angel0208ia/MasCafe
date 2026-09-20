import { getSupabaseClient } from './supabase';

export async function fetchCafeteriaOpenStatus(): Promise<boolean> {
  const { data, error } = await getSupabaseClient().rpc('get_cafeteria_open_status');
  if (error) throw error;
  return data === true;
}
