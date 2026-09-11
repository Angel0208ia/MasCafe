-- Más Café: acceso del panel de negocio, cambios de estado e historial.
-- Ejecutar después de supabase/schema.sql.

do $$
begin
  create type public.staff_role as enum ('business', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  role public.staff_role not null default 'business',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_events_order_id_created_at_idx
  on public.order_status_events(order_id, created_at);

alter table public.staff_members enable row level security;
alter table public.order_status_events enable row level security;

create or replace function public.is_staff(p_required_role public.staff_role default 'business')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members
    where user_id = auth.uid()
      and active = true
      and (p_required_role = 'business' or role = 'admin')
  );
$$;

revoke all on function public.is_staff(public.staff_role) from public;
grant execute on function public.is_staff(public.staff_role) to authenticated;

drop policy if exists "El personal consulta su perfil" on public.staff_members;
create policy "El personal consulta su perfil"
  on public.staff_members for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff('admin'));

drop policy if exists "El personal consulta pedidos" on public.orders;
create policy "El personal consulta pedidos"
  on public.orders for select
  to authenticated
  using (public.is_staff());

drop policy if exists "El personal consulta articulos" on public.order_items;
create policy "El personal consulta articulos"
  on public.order_items for select
  to authenticated
  using (public.is_staff());

drop policy if exists "El personal consulta eventos" on public.order_status_events;
create policy "El personal consulta eventos"
  on public.order_status_events for select
  to authenticated
  using (public.is_staff());

-- No dependemos de los privilegios predeterminados del esquema public.
-- Las escrituras de personal pasan exclusivamente por funciones controladas.
revoke all on public.staff_members, public.order_status_events from anon, authenticated;
grant select on public.staff_members to authenticated;
grant select on public.orders, public.order_items, public.order_status_events to authenticated;

create or replace function public.record_order_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_events (order_id, status, changed_by, created_at)
    values (new.id, new.status, auth.uid(), coalesce(new.updated_at, now()));
  end if;
  return new;
end;
$$;

drop trigger if exists record_order_status_event on public.orders;
create trigger record_order_status_event
after insert or update of status on public.orders
for each row execute function public.record_order_status_event();

insert into public.order_status_events (order_id, status, created_at)
select orders.id, orders.status, orders.created_at
from public.orders
where not exists (
  select 1 from public.order_status_events
  where order_status_events.order_id = orders.id
);

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
    or (v_current_status = 'preparing' and p_status in ('ready', 'cancelled'))
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

-- Incorpora las horas reales del seguimiento a la consulta anónima del cliente.
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
    'statusEvents', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'status', order_status_events.status,
          'createdAt', order_status_events.created_at
        ) order by order_status_events.created_at)
        from public.order_status_events
        where order_status_events.order_id = orders.id
      ),
      '[]'::jsonb
    ),
    'items', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'productId', order_items.product_id,
          'name', order_items.product_name,
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

grant execute on function public.get_anonymous_order(uuid) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
