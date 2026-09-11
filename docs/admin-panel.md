# Panel de negocio de Más Café

El panel web vive en `admin-panel` y utiliza el mismo proyecto de Supabase que
la aplicación móvil. Nunca requiere una clave `service_role` en el navegador.

## Activar la base de datos

1. Ejecuta `supabase/schema.sql` si la base todavía no fue creada.
2. Ejecuta `supabase/admin-panel.sql` en Supabase Dashboard > SQL Editor.
3. En Authentication > Users, crea el primer usuario con correo y contraseña.
4. Sustituye el correo del siguiente bloque y ejecútalo en SQL Editor:

```sql
insert into public.staff_members (user_id, display_name, role)
select id, 'Administrador', 'admin'
from auth.users
where email = 'TU_CORREO_AQUI'
on conflict (user_id) do update
set display_name = excluded.display_name,
    role = excluded.role,
    active = true,
    updated_at = now();
```

## Desarrollo local

Desde la carpeta `admin-panel`, ejecuta `npm run dev`. Durante el desarrollo el
panel puede reutilizar automáticamente las variables públicas presentes en el
`.env.local` de la aplicación móvil.

Para desplegar el panel por separado configura:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Seguridad

- `business`: consulta pedidos y actualiza su estado.
- `admin`: incluye los permisos de negocio y permitirá administrar personal.
- Las transiciones válidas se comprueban dentro de PostgreSQL.
- Cada cambio crea un registro en `order_status_events`.
- Realtime solamente entrega pedidos a usuarios autenticados y activos.

