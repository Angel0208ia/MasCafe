# Más Café — Panel de negocio

Aplicación web separada para operar los pedidos creados desde la app móvil de
Más Café. Utiliza Next.js, Supabase Auth, políticas RLS y Supabase Realtime.

## Puesta en marcha

1. Ejecuta `../supabase/admin-panel.sql` en el SQL Editor de Supabase.
2. Crea el primer usuario y asígnalo como administrador siguiendo
   `../docs/admin-panel.md`.
3. Copia `.env.example` como `.env.local` y configura las variables públicas si
   el proyecto se ejecuta fuera del repositorio principal.
4. Inicia el panel con `npm run dev`.

## Comprobaciones

- `npm run lint`
- `npm run typecheck`
- `npm run build`

La clave `service_role` no se utiliza ni debe agregarse a este proyecto.
