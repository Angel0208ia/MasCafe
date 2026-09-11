import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";
import type { BusinessOrder, StaffRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: staff } = await supabase
    .from("staff_members")
    .select("display_name, role, active")
    .eq("user_id", userId)
    .maybeSingle();
  if (!staff?.active) redirect("/unauthorized");

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, pickup_code, status, total, created_at, updated_at,
      order_items (id, product_id, product_name, quantity, unit_price, selections, notes),
      order_status_events (id, status, created_at)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return <Dashboard initialOrders={(orders ?? []) as unknown as BusinessOrder[]} staffName={staff.display_name} role={staff.role as StaffRole} />;
}

