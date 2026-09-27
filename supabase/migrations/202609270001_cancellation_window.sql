-- Dos cancelaciones separadas por menos de 12 horas bloquean nuevos pedidos por 2 horas.
-- Ejecutar en Supabase SQL Editor para actualizar la base de datos existente.
begin;

alter table public.anonymous_clients
  add column if not exists last_cancellation_at timestamptz;

-- Recupera la última cancelación del historial sin borrar pedidos ni contadores.
update public.anonymous_clients as client
set last_cancellation_at = history.last_cancelled_at
from (
  select client_token, max(updated_at) as last_cancelled_at
  from public.orders
  where status = 'cancelled' and client_token is not null
  group by client_token
) as history
where client.client_token = history.client_token
  and client.last_cancellation_at is null;

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
  v_last_cancellation_at timestamptz;
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

  select anonymous_clients.cancellation_count, anonymous_clients.blocked_until,
         anonymous_clients.last_cancellation_at
  into v_cancellation_count, v_blocked_until, v_last_cancellation_at
  from public.anonymous_clients
  where anonymous_clients.client_token = v_client_token
  for update;

  v_cancellation_count := v_cancellation_count + 1;
  -- El total se conserva para auditoría; la sanción depende de la última cancelación.
  if v_last_cancellation_at > now() - interval '12 hours' then
    v_blocked_until := now() + interval '2 hours';
  elsif v_blocked_until is null or v_blocked_until <= now() then
    v_blocked_until := null;
  end if;

  update public.anonymous_clients
  set cancellation_count = v_cancellation_count,
      blocked_until = v_blocked_until,
      last_cancellation_at = now(),
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

revoke all on function public.cancel_anonymous_order(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cancel_anonymous_order(uuid, uuid) to anon;

commit;
