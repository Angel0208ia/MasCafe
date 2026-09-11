-- Ejecutar una vez en Supabase Dashboard > SQL Editor para activar las
-- promociones en una base de datos de Más Café que ya está funcionando.

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
    where id = v_item ->> 'productId' and available = true;

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
      order_id, product_id, product_name, quantity, unit_price, selections, notes
    ) values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_quantity,
      v_unit_price,
      coalesce(v_item -> 'selections', '[]'::jsonb),
      left(coalesce(v_item ->> 'notes', ''), 140)
    );

    v_total := v_total + (v_unit_price * v_quantity);
  end loop;

  v_weekday := extract(isodow from (now() at time zone 'America/Cancun'))::integer;

  if v_weekday = 2 then
    select coalesce(sum(quantity), 0)::integer
    into v_cappuccino_quantity
    from public.order_items
    where order_id = v_order_id and product_id = '2';

    v_promotion_discount := (v_cappuccino_quantity / 2) * 15;
  elsif v_weekday = 4 then
    select
      coalesce(sum(quantity) filter (where product_id = '55'), 0)::integer,
      coalesce(sum(quantity) filter (where product_id = '7'), 0)::integer
    into v_brownie_quantity, v_matcha_quantity
    from public.order_items
    where order_id = v_order_id and product_id in ('55', '7');

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

grant execute on function public.create_anonymous_order(jsonb) to anon, authenticated;
