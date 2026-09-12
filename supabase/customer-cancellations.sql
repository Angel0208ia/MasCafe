-- Más Café: cancelación de pedidos anónimos y sanción por reincidencia.
-- Ejecutar una vez en Supabase Dashboard > SQL Editor.

create table if not exists public.anonymous_clients (
  client_token uuid primary key default gen_random_uuid(),
  cancellation_count integer not null default 0 check (cancellation_count >= 0),
  blocked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists client_token uuid references public.anonymous_clients(client_token);

create index if not exists orders_client_token_idx on public.orders(client_token);

alter table public.anonymous_clients enable row level security;
revoke all on public.anonymous_clients from anon, authenticated;

-- Conserva la creación y validación de precios existente, pero asocia el
-- pedido con una identidad anónima persistente y aplica el bloqueo del servidor.
create or replace function public.create_anonymous_order_with_client(
  p_items jsonb,
  p_client_token uuid default null
)
returns table (
  order_id uuid,
  pickup_code text,
  tracking_token uuid,
  status public.order_status,
  total numeric,
  anonymous_client_token uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_token uuid := coalesce(p_client_token, gen_random_uuid());
  v_blocked_until timestamptz;
  v_created record;
begin
  insert into public.anonymous_clients (client_token)
  values (v_client_token)
  on conflict (client_token) do nothing;

  select anonymous_clients.blocked_until
  into v_blocked_until
  from public.anonymous_clients
  where anonymous_clients.client_token = v_client_token
  for update;

  if v_blocked_until is not null and v_blocked_until > now() then
    raise exception 'No puedes generar pedidos hasta % por cancelaciones reiteradas',
      to_char(v_blocked_until at time zone 'America/Cancun', 'DD/MM/YYYY HH24:MI');
  end if;

  select * into v_created
  from public.create_anonymous_order(p_items);

  update public.orders
  set client_token = v_client_token
  where id = v_created.order_id;

  return query select
    v_created.order_id,
    v_created.pickup_code,
    v_created.tracking_token,
    v_created.status,
    v_created.total,
    v_client_token;
end;
$$;

revoke all on function public.create_anonymous_order_with_client(jsonb, uuid) from public;
grant execute on function public.create_anonymous_order_with_client(jsonb, uuid) to anon, authenticated;

create or replace function public.cancel_anonymous_order(
  p_tracking_token uuid,
  p_client_token uuid default null
)
returns table (
  cancelled_order_id uuid,
  cancelled_status public.order_status,
  anonymous_client_token uuid,
  total_cancellations integer,
  ordering_blocked_until timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_status public.order_status;
  v_order_client_token uuid;
  v_client_token uuid;
  v_cancellation_count integer;
  v_blocked_until timestamptz;
begin
  select orders.id, orders.status, orders.client_token
  into v_order_id, v_status, v_order_client_token
  from public.orders
  where orders.tracking_token = p_tracking_token
  for update;

  if not found then
    raise exception 'Pedido no encontrado';
  end if;

  if v_status <> 'received' then
    if v_status = 'preparing' then
      raise exception 'El pedido ya está en preparación y no se puede cancelar';
    end if;
    raise exception 'Este pedido ya no se puede cancelar';
  end if;

  if v_order_client_token is not null
    and (p_client_token is null or p_client_token <> v_order_client_token) then
    raise exception 'La autorización del cliente no corresponde a este pedido';
  end if;

  v_client_token := coalesce(v_order_client_token, p_client_token, gen_random_uuid());

  insert into public.anonymous_clients (client_token)
  values (v_client_token)
  on conflict (client_token) do nothing;

  select anonymous_clients.cancellation_count, anonymous_clients.blocked_until
  into v_cancellation_count, v_blocked_until
  from public.anonymous_clients
  where anonymous_clients.client_token = v_client_token
  for update;

  v_cancellation_count := v_cancellation_count + 1;
  if v_cancellation_count >= 2 then
    v_blocked_until := now() + interval '2 hours';
  end if;

  update public.anonymous_clients
  set cancellation_count = v_cancellation_count,
      blocked_until = v_blocked_until,
      updated_at = now()
  where client_token = v_client_token;

  update public.orders
  set status = 'cancelled', client_token = v_client_token, updated_at = now()
  where id = v_order_id;

  return query select
    v_order_id,
    'cancelled'::public.order_status,
    v_client_token,
    v_cancellation_count,
    v_blocked_until;
end;
$$;

revoke all on function public.cancel_anonymous_order(uuid, uuid) from public;
grant execute on function public.cancel_anonymous_order(uuid, uuid) to anon, authenticated;

-- El panel filtra los cancelados, pero conserva permiso de lectura para recibir
-- el evento Realtime que hace que desaparezcan inmediatamente de la interfaz.
drop policy if exists "El personal consulta pedidos" on public.orders;
create policy "El personal consulta pedidos"
  on public.orders for select
  to authenticated
  using (public.is_staff());

-- El negocio tampoco puede cancelar un pedido que ya comenzó a prepararse.
create or replace function public.staff_update_order_status(
  p_order_id uuid,
  p_status public.order_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status public.order_status;
begin
  if not public.is_staff() then
    raise exception 'No tienes permiso para actualizar pedidos';
  end if;

  select status into v_current_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido no encontrado';
  end if;

  if v_current_status = p_status then
    return;
  end if;

  if not (
    (v_current_status = 'received' and p_status in ('preparing', 'cancelled'))
    or (v_current_status = 'preparing' and p_status = 'ready')
    or (v_current_status = 'ready' and p_status = 'delivered')
  ) then
    raise exception 'Cambio de estado no permitido: % -> %', v_current_status, p_status;
  end if;

  update public.orders
  set status = p_status, updated_at = now()
  where id = p_order_id;
end;
$$;

revoke all on function public.staff_update_order_status(uuid, public.order_status) from public;
grant execute on function public.staff_update_order_status(uuid, public.order_status) to authenticated;
