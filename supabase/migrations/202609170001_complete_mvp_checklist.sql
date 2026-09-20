-- Complemento incremental para bases existentes. Ejecutar después de
-- schema.sql, admin-panel.sql y menu-management.sql.

alter table public.products add column if not exists active boolean not null default true;
alter table public.order_items add column if not exists image text not null default '';

create table if not exists public.business_settings (
  id smallint primary key default 1 check (id = 1),
  is_open boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.business_settings (id, is_open) values (1, true)
on conflict (id) do nothing;
alter table public.business_settings enable row level security;

create or replace function public.get_cafeteria_open_status()
returns boolean language sql stable security definer set search_path = public
as $$ select is_open from public.business_settings where id = 1 $$;
revoke all on function public.get_cafeteria_open_status() from public;
grant execute on function public.get_cafeteria_open_status() to anon, authenticated;

create or replace function public.staff_set_cafeteria_open(p_is_open boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'No autorizado'; end if;
  update public.business_settings set is_open = p_is_open, updated_at = now() where id = 1;
  return p_is_open;
end;
$$;
revoke all on function public.staff_set_cafeteria_open(boolean) from public, anon;
grant execute on function public.staff_set_cafeteria_open(boolean) to authenticated;

create or replace function public.prevent_orders_when_closed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select is_open from public.business_settings where id = 1), true) then
    raise exception 'La cafetería no está recibiendo pedidos en este momento';
  end if;
  return new;
end;
$$;
drop trigger if exists orders_require_open_cafeteria on public.orders;
create trigger orders_require_open_cafeteria before insert on public.orders
for each row execute function public.prevent_orders_when_closed();

create or replace function public.snapshot_order_item_image_and_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_product public.products%rowtype;
begin
  select * into v_product from public.products where id = new.product_id;
  if not found or not v_product.active then raise exception 'Uno de los productos ya no está activo'; end if;
  new.image := v_product.image;
  return new;
end;
$$;
drop trigger if exists order_items_snapshot_image on public.order_items;
create trigger order_items_snapshot_image before insert on public.order_items
for each row execute function public.snapshot_order_item_image_and_activity();

create or replace function public.get_anonymous_order(p_tracking_token uuid)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'id', orders.id, 'number', orders.pickup_code, 'status', orders.status,
    'createdAt', orders.created_at, 'total', orders.total,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'productId', order_items.product_id, 'name', order_items.product_name,
      'image', order_items.image, 'quantity', order_items.quantity,
      'unitPrice', order_items.unit_price, 'selections', order_items.selections,
      'notes', order_items.notes) order by order_items.id)
      from public.order_items where order_items.order_id = orders.id), '[]'::jsonb)
  ) from public.orders where orders.tracking_token = p_tracking_token;
$$;
revoke all on function public.get_anonymous_order(uuid) from public;
grant execute on function public.get_anonymous_order(uuid) to anon;

-- El canal incluye un token de seguimiento UUID no visible en la interfaz.
create or replace function public.broadcast_anonymous_order_status()
returns trigger language plpgsql security definer set search_path = public, realtime as $$
begin
  if new.status is distinct from old.status then
    perform realtime.send(jsonb_build_object('orderId', new.id, 'status', new.status),
      'order-status', 'order:' || new.tracking_token::text, false);
  end if;
  return new;
end;
$$;
drop trigger if exists broadcast_anonymous_order_status on public.orders;
create trigger broadcast_anonymous_order_status after update of status on public.orders
for each row execute function public.broadcast_anonymous_order_status();
