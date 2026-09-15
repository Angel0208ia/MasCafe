-- Reduce la superficie RPC sin romper el cliente anónimo ni el panel autenticado.
begin;

-- Supabase/Postgres concede EXECUTE a PUBLIC por defecto. Revocar tanto PUBLIC
-- como los roles explícitos evita conservar permisos de instalaciones antiguas.
revoke execute on function public.create_anonymous_order(jsonb)
  from public, anon, authenticated;
revoke execute on function public.create_anonymous_order_with_client(jsonb, uuid)
  from public, anon, authenticated;
revoke execute on function public.cancel_anonymous_order(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function public.get_anonymous_order(uuid)
  from public, anon, authenticated;
revoke execute on function public.get_weekly_best_sellers()
  from public, anon, authenticated;
revoke execute on function public.is_staff(public.staff_role)
  from public, anon, authenticated;
revoke execute on function public.record_order_status_event()
  from public, anon, authenticated;
revoke execute on function public.staff_update_order_status(uuid, public.order_status)
  from public, anon, authenticated;

-- El cliente no inicia sesión: estos RPC validan tokens aleatorios o publican
-- únicamente un agregado sin datos de pedidos/clientes.
grant execute on function public.create_anonymous_order_with_client(jsonb, uuid) to anon;
grant execute on function public.cancel_anonymous_order(uuid, uuid) to anon;
grant execute on function public.get_anonymous_order(uuid) to anon;
grant execute on function public.get_weekly_best_sellers() to anon;

-- El panel sí requiere sesión. Ambas funciones validan auth.uid() y el rol.
grant execute on function public.is_staff(public.staff_role) to authenticated;
grant execute on function public.staff_update_order_status(uuid, public.order_status) to authenticated;

-- El trigger se ejecuta dentro de las operaciones autorizadas; no necesita los
-- privilegios del propietario ni ser invocable por la Data API.
alter function public.record_order_status_event() security invoker;

-- Las funciones nuevas dejan de publicarse accidentalmente. Cada RPC futuro
-- deberá recibir un GRANT explícito en su propia migración.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

commit;
