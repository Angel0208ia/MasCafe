-- Exige una ubicación válida dentro de Tecmilenio Campus Cancún al crear pedidos.
-- Las coordenadas se usan durante la validación y no se guardan en el pedido.

begin;

create or replace function public.is_within_tecmilenio_cancun(
  p_latitude double precision,
  p_longitude double precision
)
returns boolean
language plpgsql
immutable
security invoker
set search_path = public
as $$
declare
  v_latitudes double precision[] := array[
    21.1317622, 21.1313783, 21.1309755, 21.1325966,
    21.1328423, 21.1331620, 21.1332158, 21.1331615,
    21.1330111, 21.1327260, 21.1327003, 21.1326576
  ];
  v_longitudes double precision[] := array[
    -86.8272884, -86.8266301, -86.8259394, -86.8251115,
    -86.8256702, -86.8263781, -86.8265071, -86.8265349,
    -86.8266155, -86.8267682, -86.8267819, -86.8268050
  ];
  v_inside boolean := false;
  v_current integer;
  v_previous integer := array_length(v_latitudes, 1);
  v_crossing_longitude double precision;
begin
  if p_latitude is null or p_longitude is null then return false; end if;
  if p_latitude < 21.1309755 or p_latitude > 21.1332158
    or p_longitude < -86.8272884 or p_longitude > -86.8251115 then
    return false;
  end if;

  for v_current in 1..array_length(v_latitudes, 1) loop
    if (v_latitudes[v_current] > p_latitude) <> (v_latitudes[v_previous] > p_latitude) then
      v_crossing_longitude :=
        (v_longitudes[v_previous] - v_longitudes[v_current])
        * (p_latitude - v_latitudes[v_current])
        / (v_latitudes[v_previous] - v_latitudes[v_current])
        + v_longitudes[v_current];

      if p_longitude < v_crossing_longitude then v_inside := not v_inside; end if;
    end if;
    v_previous := v_current;
  end loop;

  return v_inside;
end;
$$;

revoke all on function public.is_within_tecmilenio_cancun(double precision, double precision)
  from public, anon, authenticated;

drop function if exists public.create_anonymous_order_with_client(jsonb, uuid);

create function public.create_anonymous_order_with_client(
  p_items jsonb,
  p_client_token uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy double precision
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
  if p_accuracy is null or p_accuracy < 0 or p_accuracy > 100 then
    raise exception 'La ubicación no tiene suficiente precisión para generar el pedido';
  end if;

  if not public.is_within_tecmilenio_cancun(p_latitude, p_longitude) then
    raise exception 'Debes encontrarte dentro de Tecmilenio Campus Cancún para realizar pedidos';
  end if;

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

revoke all on function public.create_anonymous_order_with_client(
  jsonb, uuid, double precision, double precision, double precision
) from public, anon, authenticated;

grant execute on function public.create_anonymous_order_with_client(
  jsonb, uuid, double precision, double precision, double precision
) to anon;

commit;
