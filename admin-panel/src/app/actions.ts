"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_previousState: { error: string }, formData: FormData) {
  const failure = { error: "No fue posible iniciar sesión. Revisa tus credenciales y acceso." };
  const rawEmail = formData.get("email");
  const password = formData.get("password");
  if (typeof rawEmail !== "string" || typeof password !== "string") return failure;
  const email = rawEmail.trim().toLowerCase();
  if (formData.get("website") || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length === 0 || password.length > 256) return failure;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return error?.status === 429
        ? { error: "Demasiados intentos. Espera unos minutos antes de intentar nuevamente." }
        : failure;
    }
    const { data: staff, error: staffError } = await supabase
      .from("staff_members").select("active").eq("user_id", data.user.id).maybeSingle();
    if (staffError || !staff?.active) {
      await supabase.auth.signOut();
      return failure;
    }
  } catch {
    return failure;
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
