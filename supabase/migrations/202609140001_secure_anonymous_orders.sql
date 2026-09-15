-- Protege la creación anónima de pedidos en instalaciones existentes.
-- Ejecutar mediante Supabase migrations antes de publicar esta versión.

revoke all on function public.create_anonymous_order(jsonb)
  from public, anon, authenticated;

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
  v_last_order_at timestamptz;
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

  -- El bloqueo se valida en el servidor y la fila del cliente permanece
  -- bloqueada durante la transacción para impedir pedidos simultáneos.
  select max(orders.created_at)
  into v_last_order_at
  from public.orders
  where orders.client_token = v_client_token
    and orders.status <> 'cancelled';

  if v_last_order_at is not null
    and v_last_order_at > now() - interval '30 minutes' then
    raise exception 'Por el momento solo se permite un pedido cada 30 minutos';
  end if;

  select * into v_created from public.create_anonymous_order(p_items);

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

  if not found then raise exception 'Pedido no encontrado'; end if;
  if v_status = 'preparing' then
    raise exception 'El pedido ya está en preparación y no se puede cancelar';
  elsif v_status <> 'received' then
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

alter table public.anonymous_clients enable row level security;
revoke all on public.anonymous_clients from anon, authenticated;
revoke all on function public.create_anonymous_order_with_client(jsonb, uuid) from public, anon, authenticated;
revoke all on function public.cancel_anonymous_order(uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_anonymous_order_with_client(jsonb, uuid) to anon;
grant execute on function public.cancel_anonymous_order(uuid, uuid) to anon;

