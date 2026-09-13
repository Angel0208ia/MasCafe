-- Ejecutar después de schema.sql y menu-management.sql. Transacción atómica.
begin;
create table if not exists public.promotions (
  id text primary key default gen_random_uuid()::text,
  title text not null check (length(title) between 1 and 120),
  description text not null default '' check (length(description) <= 500),
  day integer not null check (day between 0 and 6),
  discount numeric(12,2) not null check (discount > 0),
  active boolean not null default true,
  requirements jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.promotions enable row level security;
revoke all on public.promotions from anon, authenticated;
grant select on public.promotions to anon, authenticated;
grant insert, update, delete on public.promotions to authenticated;
drop policy if exists promotions_read on public.promotions;
create policy promotions_read on public.promotions for select using (true);
drop policy if exists promotions_admin on public.promotions;
create policy promotions_admin on public.promotions for all to authenticated
  using (public.is_staff('admin')) with check (public.is_staff('admin'));

create or replace function public.validate_promotion()
returns trigger language plpgsql set search_path = public as $$
declare r jsonb; n integer := 0; ids text[] := '{}'; subtotal numeric := 0; price numeric;
begin
  if jsonb_typeof(new.requirements) <> 'array' or jsonb_array_length(new.requirements) not between 1 and 3 then
    raise exception 'Combo inválido';
  end if;
  for r in select value from jsonb_array_elements(new.requirements) loop
    if jsonb_typeof(r) is distinct from 'object' or jsonb_typeof(r->'quantity') is distinct from 'number' or coalesce((r->>'quantity') !~ '^[1-3]$',true) or
       jsonb_typeof(r->'productId') is distinct from 'string' or r->>'productId' is null or (r->>'productId') = any(ids) then raise exception 'Artículo o cantidad inválida'; end if;
    select base_price into price from public.products where id = r->>'productId';
    if not found then raise exception 'El artículo no existe'; end if;
    n := n + (r->>'quantity')::integer;
    subtotal := subtotal + price * (r->>'quantity')::integer;
    ids := array_append(ids, r->>'productId');
  end loop;
  if n > 3 or new.discount > subtotal then raise exception 'Descuento o cantidad inválida'; end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists validate_promotion on public.promotions;
create trigger validate_promotion before insert or update on public.promotions
for each row execute function public.validate_promotion();

-- Conserva las dos promociones originales en la primera instalación.
insert into public.promotions (id,title,description,day,discount,requirements)
select 'tuesday-cappuccino','Segundo cappuccino por $45','Lleva dos cappuccinos y el segundo queda a precio especial.',2,15,'[{"productId":"2","quantity":2}]'::jsonb
where exists (select 1 from public.products where id='2')
on conflict do nothing;
insert into public.promotions (id,title,description,day,discount,requirements)
select 'thursday-brownie-matcha','Brownie + matcha','Combina un brownie con un matcha y disfruta el precio especial.',4,15,'[{"productId":"55","quantity":1},{"productId":"7","quantity":1}]'::jsonb
where (select count(*) from public.products where id in ('55','7'))=2
on conflict do nothing;

-- Busca el mayor ahorro sin usar el mismo artículo en dos combos.
create or replace function public.calculate_promotion_discount(p_items jsonb)
returns numeric language sql stable set search_path = public as $$
with recursive candidates as (
 select p.id,p.discount,p.requirements from public.promotions p
 where p.active and p.day=extract(dow from now() at time zone 'America/Cancun')::integer
 and not exists (select 1 from jsonb_array_elements(p.requirements) r
                 left join public.products pr on pr.id=r->>'productId'
                 where pr.id is null or not pr.available)
), search(remaining,discount,depth) as (
 select coalesce(jsonb_object_agg(product_id,quantity),'{}'::jsonb),0::numeric,0
 from (select value->>'productId' product_id,sum((value->>'quantity')::integer) quantity
       from jsonb_array_elements(p_items) group by 1) q
 union all
 select (select jsonb_object_agg(e.key,to_jsonb((e.value #>> '{}')::integer - coalesce((
    select (r->>'quantity')::integer from jsonb_array_elements(c.requirements) r where r->>'productId'=e.key),0)))
    from jsonb_each(s.remaining) e),s.discount+c.discount,s.depth+1
 from search s cross join candidates c
 where s.depth<3 and not exists (select 1 from jsonb_array_elements(c.requirements) r
   where coalesce((s.remaining->>(r->>'productId'))::integer,0)<(r->>'quantity')::integer)
)
select coalesce(max(discount),0) from search;
$$;
revoke all on function public.calculate_promotion_discount(jsonb) from public;

-- Modifica únicamente el bloque de descuentos, preservando las validaciones
-- existentes y la función envolvente de cancelaciones/bloqueos.
do $$
declare definition text; first_pos integer; last_pos integer;
begin
  definition := pg_get_functiondef('public.create_anonymous_order(jsonb)'::regprocedure);
  first_pos := strpos(definition,'v_weekday :=');
  last_pos := strpos(definition,'v_total := greatest(0, v_total - v_promotion_discount);');
  if first_pos > 0 and last_pos > first_pos then
    definition := substring(definition from 1 for first_pos-1) ||
      'v_weekday := 0; v_promotion_discount := public.calculate_promotion_discount(p_items);' || chr(10) ||
      substring(definition from last_pos);
  elsif strpos(definition, 'public.calculate_promotion_discount(p_items)') > 0 then
    -- Ya instalada en la variante con contador diario.
    null;
  elsif definition ~* 'update\s+orders\s+set\s+total\s*=\s*v_total' and
        strpos(definition, 'daily_order_counter') > 0 then
    -- Variante observada en producción: contador diario y total sin descuentos.
    definition := regexp_replace(definition,
      'update\s+orders\s+set\s+total\s*=\s*v_total',
      'v_total := greatest(0, v_total - public.calculate_promotion_discount(p_items)); UPDATE orders SET total = v_total', 'i');
  else
    raise exception 'No se reconoce la función de pedidos; no se realizaron cambios';
  end if;
  execute definition;
end $$;
notify pgrst, 'reload schema';
commit;
