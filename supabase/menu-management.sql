-- Ejecutar después de schema.sql y admin-panel.sql en el SQL Editor.
begin;
grant insert, update, delete on public.products to authenticated;
drop policy if exists "Administradores crean productos" on public.products;
create policy "Administradores crean productos" on public.products for insert to authenticated with check (public.is_staff('admin'));
drop policy if exists "Administradores editan productos" on public.products;
create policy "Administradores editan productos" on public.products for update to authenticated using (public.is_staff('admin')) with check (public.is_staff('admin'));
drop policy if exists "Administradores eliminan productos" on public.products;
create policy "Administradores eliminan productos" on public.products for delete to authenticated using (public.is_staff('admin'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 2097152, array['image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/webp'];
drop policy if exists "Administradores suben fotos del menu" on storage.objects;
create policy "Administradores suben fotos del menu" on storage.objects for insert to authenticated with check (bucket_id = 'menu-images' and public.is_staff('admin'));
drop policy if exists "Administradores consultan fotos del menu" on storage.objects;
create policy "Administradores consultan fotos del menu" on storage.objects for select to authenticated using (bucket_id = 'menu-images' and public.is_staff('admin'));
drop policy if exists "Administradores eliminan fotos del menu" on storage.objects;
create policy "Administradores eliminan fotos del menu" on storage.objects for delete to authenticated using (bucket_id = 'menu-images' and public.is_staff('admin'));
commit;
