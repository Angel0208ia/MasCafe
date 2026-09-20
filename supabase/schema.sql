-- Más Café: pedidos anónimos
-- Ejecutar una vez en Supabase Dashboard > SQL Editor > New query.
-- No se almacenan nombres, correos, matrículas, teléfonos ni identificadores de dispositivo.

create extension if not exists pgcrypto;

create type public.order_status as enum (
  'received',
  'preparing',
  'ready',
  'delivered',
  'cancelled'
);

-- El catálogo vivirá aquí cuando migremos products.json. customizations conserva
-- la misma estructura de grupos/opciones que ya usa la aplicación.
create table public.products (
  id text primary key,
  name text not null,
  description text not null default '',
  image text not null default '',
  category text not null,
  base_price numeric(10, 2) not null check (base_price >= 0),
  active boolean not null default true,
  available boolean not null default true,
  customizations jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create sequence public.pickup_code_sequence start with 1000;

create table public.anonymous_clients (
  client_token uuid primary key default gen_random_uuid(),
  cancellation_count integer not null default 0 check (cancellation_count >= 0),
  blocked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Es el número que muestra el estudiante al recoger el pedido.
  pickup_code text not null unique,
  -- No identifica a una persona. Es una capacidad aleatoria privada para
  -- consultar el estado desde el teléfono que hizo el pedido.
  tracking_token uuid not null unique default gen_random_uuid(),
  client_token uuid references public.anonymous_clients(client_token),
  status public.order_status not null default 'received',
  total numeric(10, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_settings (
  id smallint primary key default 1 check (id = 1),
  is_open boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id, is_open) values (1, true);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  image text not null default '',
  quantity integer not null check (quantity between 1 and 3),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  selections jsonb not null default '[]'::jsonb,
  notes text not null default '' check (char_length(notes) <= 140)
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_created_at_idx on public.orders (status, created_at);
create index orders_client_token_idx on public.orders (client_token);
create index order_items_order_id_idx on public.order_items (order_id);

-- Calcula el precio exclusivamente con el catálogo del servidor. Los nombres y
-- extraPrice enviados por la app se ignoran: un cliente no puede cambiar precios.
create or replace function public.calculate_item_unit_price(
  p_base_price numeric,
  p_customizations jsonb,
  p_selections jsonb
)
returns numeric
language plpgsql
immutable
set search_path = public
as $$
declare
  v_group jsonb;
  v_selection jsonb;
  v_option jsonb;
  v_selected_count integer;
  v_minimum integer;
  v_maximum integer;
  v_extra_price numeric;
  v_price numeric := p_base_price;
begin
  if jsonb_typeof(p_selections) <> 'array' then
    raise exception 'Las personalizaciones deben ser una lista';
  end if;

  -- No se permite enviar grupos que no existan en el producto.
  for v_selection in select value from jsonb_array_elements(p_selections)
  loop
    if not exists (
      select 1
      from jsonb_array_elements(p_customizations) configured_group
      where configured_group ->> 'id' = v_selection ->> 'groupId'
    ) then
      raise exception 'Personalización no válida';
    end if;
  end loop;

  for v_group in select value from jsonb_array_elements(p_customizations)
  loop
    select coalesce(sum(jsonb_array_length(coalesce(value -> 'options', '[]'::jsonb))), 0)
    into v_selected_count
    from jsonb_array_elements(p_selections)
    where value ->> 'groupId' = v_group ->> 'id';

    v_minimum := coalesce(
      nullif(v_group ->> 'minSelections', '')::integer,
      case when coalesce((v_group ->> 'required')::boolean, false) then 1 else 0 end
    );
    v_maximum := nullif(v_group ->> 'maxSelections', '')::integer;

    if v_selected_count < v_minimum
      or (v_maximum is not null and v_selected_count > v_maximum) then
      raise exception 'Cantidad de personalizaciones no válida';
    end if;

    for v_option in
      select selected_option
      from jsonb_array_elements(p_selections) selected_group
      cross join lateral jsonb_array_elements(coalesce(selected_group -> 'options', '[]'::jsonb)) selected_option
      where selected_group ->> 'groupId' = v_group ->> 'id'
    loop
      if not exists (
        select 1
        from jsonb_array_elements(coalesce(v_group -> 'options', '[]'::jsonb)) configured_option
        where configured_option ->> 'id' = v_option ->> 'id'
      ) then
        raise exception 'Opción de personalización no válida';
      end if;

      select coalesce((configured_option ->> 'extraPrice')::numeric, 0)
      into strict v_extra_price
      from jsonb_array_elements(v_group -> 'options') configured_option
      where configured_option ->> 'id' = v_option ->> 'id';

      -- El precio enviado por la app se ignora. Sólo se suma el configurado
      -- en el catálogo de la base de datos.
      v_price := v_price + v_extra_price;
    end loop;
  end loop;

  return v_price;
end;
$$;

-- Crea el pedido y el número de recogida en una única transacción.
-- Entrada esperada:
-- [{"productId":"1","quantity":1,"notes":"","selections":[...]}]
create or replace function public.create_anonymous_order(p_items jsonb)
returns table (order_id uuid, pickup_code text, tracking_token uuid, status public.order_status, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_total_quantity integer := 0;
  v_unit_price numeric;
  v_order_id uuid;
  v_pickup_code text;
  v_tracking_token uuid;
  v_total numeric := 0;
  v_weekday integer;
  v_cappuccino_quantity integer := 0;
  v_brownie_quantity integer := 0;
  v_matcha_quantity integer := 0;
  v_promotion_discount numeric := 0;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe contener al menos un artículo';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := nullif(v_item ->> 'quantity', '')::integer;
    if v_quantity is null or v_quantity < 1 then
      raise exception 'Cantidad no válida';
    end if;
    v_total_quantity := v_total_quantity + v_quantity;
  end loop;

  if v_total_quantity > 3 then
    raise exception 'Solo se permiten 3 artículos por pedido';
  end if;

  v_pickup_code := 'MC-' || lpad(nextval('public.pickup_code_sequence')::text, 6, '0');

  insert into public.orders (pickup_code, total)
  values (v_pickup_code, 0)
  returning id, tracking_token into v_order_id, v_tracking_token;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where id = v_item ->> 'productId' and active = true and available = true;

    if not found then
      raise exception 'Uno de los productos ya no está disponible';
    end if;

    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_price := public.calculate_item_unit_price(
      v_product.base_price,
      v_product.customizations,
      coalesce(v_item -> 'selections', '[]'::jsonb)
    );

    insert into public.order_items (
      order_id, product_id, product_name, image, quantity, unit_price, selections, notes
    ) values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.image,
      v_quantity,
      v_unit_price,
      coalesce(v_item -> 'selections', '[]'::jsonb),
      left(coalesce(v_item ->> 'notes', ''), 140)
    );

    v_total := v_total + (v_unit_price * v_quantity);
  end loop;

  -- Las promociones se validan con la fecha de la cafetería y con los
  -- productos guardados por el servidor. Los extras conservan su precio.
  v_weekday := extract(isodow from (now() at time zone 'America/Cancun'))::integer;

  if v_weekday = 2 then
    select coalesce(sum(quantity), 0)::integer
    into v_cappuccino_quantity
    from public.order_items
    where order_id = v_order_id and product_id = '2';

    -- Martes: por cada par, el segundo cappuccino baja de $60 a $45.
    v_promotion_discount := (v_cappuccino_quantity / 2) * 15;
  elsif v_weekday = 4 then
    select
      coalesce(sum(quantity) filter (where product_id = '55'), 0)::integer,
      coalesce(sum(quantity) filter (where product_id = '7'), 0)::integer
    into v_brownie_quantity, v_matcha_quantity
    from public.order_items
    where order_id = v_order_id and product_id in ('55', '7');

    -- Jueves: cada pareja de brownie + matcha recibe $15 de descuento.
    v_promotion_discount := least(v_brownie_quantity, v_matcha_quantity) * 15;
  end if;

  v_total := greatest(0, v_total - v_promotion_discount);

  update public.orders
  set total = v_total, updated_at = now()
  where id = v_order_id;

  return query
  select v_order_id, v_pickup_code, v_tracking_token, 'received'::public.order_status, v_total;
end;
$$;

-- Permite a la app consultar únicamente el pedido para el que posee el token.
create or replace function public.get_anonymous_order(p_tracking_token uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', orders.id,
    'number', orders.pickup_code,
    'status', orders.status,
    'createdAt', orders.created_at,
    'total', orders.total,
    'items', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'productId', order_items.product_id,
          'name', order_items.product_name,
          'image', order_items.image,
          'quantity', order_items.quantity,
          'unitPrice', order_items.unit_price,
          'selections', order_items.selections,
          'notes', order_items.notes
        ) order by order_items.id)
        from public.order_items
        where order_items.order_id = orders.id
      ),
      '[]'::jsonb
    )
  )
  from public.orders
  where orders.tracking_token = p_tracking_token;
$$;

-- Catálogo: lectura pública. Pedidos: sin acceso directo desde la app.
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.business_settings enable row level security;

create policy "El menú es público"
  on public.products for select
  to anon, authenticated
  using (true);

revoke all on public.orders, public.order_items from anon, authenticated;
grant select on public.products to anon, authenticated;
-- Esta función es interna: la app debe usar la versión que exige client_token.
revoke all on function public.create_anonymous_order(jsonb) from public, anon, authenticated;
grant execute on function public.get_anonymous_order(uuid) to anon;

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

create or replace function public.create_anonymous_order_with_client(
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
revoke all on function public.create_anonymous_order_with_client(
  jsonb, uuid, double precision, double precision, double precision
) from public, anon, authenticated;
revoke all on function public.cancel_anonymous_order(uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_anonymous_order_with_client(
  jsonb, uuid, double precision, double precision, double precision
) to anon;
grant execute on function public.cancel_anonymous_order(uuid, uuid) to anon;

create or replace function public.get_cafeteria_open_status()
returns boolean language sql stable security definer set search_path = public
as $$ select is_open from public.business_settings where id = 1 $$;
revoke all on function public.get_cafeteria_open_status() from public;
grant execute on function public.get_cafeteria_open_status() to anon, authenticated;

create or replace function public.prevent_orders_when_closed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select is_open from public.business_settings where id = 1), true) then
    raise exception 'La cafetería no está recibiendo pedidos en este momento';
  end if;
  return new;
end;
$$;
create trigger orders_require_open_cafeteria before insert on public.orders
for each row execute function public.prevent_orders_when_closed();

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
create trigger broadcast_anonymous_order_status after update of status on public.orders
for each row execute function public.broadcast_anonymous_order_status();
