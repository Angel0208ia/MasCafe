-- Solo publica el ranking agregado, nunca pedidos ni identificadores de clientes.
begin;
create or replace function public.get_weekly_best_sellers()
returns table (product_id text, quantity bigint)
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select i.product_id, sum(i.quantity)::bigint as quantity
  from public.orders o
  join public.order_items i on i.order_id = o.id
  join public.products p on p.id = i.product_id and p.available
  where o.status = 'delivered'
    and o.created_at >= (date_trunc('week', now() at time zone 'America/Cancun') at time zone 'America/Cancun')
    and o.created_at < ((date_trunc('week', now() at time zone 'America/Cancun') + interval '1 week') at time zone 'America/Cancun')
  group by i.product_id
  order by sum(i.quantity) desc, i.product_id
  limit 3;
$$;
revoke all on function public.get_weekly_best_sellers() from public, anon, authenticated;
grant execute on function public.get_weekly_best_sellers() to anon;
commit;
