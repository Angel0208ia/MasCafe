"use server";

import { createClient } from "@/lib/supabase/server";

export async function setCafeteriaOpen(isOpen: boolean) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || typeof isOpen !== "boolean") return { error: "No autorizado." };
  const { error } = await db.rpc("staff_set_cafeteria_open", { p_is_open: isOpen });
  return error ? { error: "No se pudo actualizar el estado de la cafetería." } : { isOpen };
}
