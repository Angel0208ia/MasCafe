# Más Café — Panel de negocio

Aplicación web separada para operar los pedidos creados desde la app móvil de
Más Café. Utiliza Next.js, Supabase Auth, políticas RLS y Supabase Realtime.

## Puesta en marcha

1. Prepara los archivos SQL siguiendo el [README principal](../README.md#configurar-supabase).
2. Crea el primer usuario y asígnalo como administrador siguiendo
   `../docs/admin-panel.md`.
3. Copia `.env.example` como `.env.local` y configura las variables públicas si
   el proyecto se ejecuta fuera del repositorio principal.
4. Instala dependencias con `npm ci` e inicia el panel con `npm run dev`.

Abre [http://localhost:3000](http://localhost:3000). Para ejecutar las pruebas usa Node.js 24 LTS.

## Funciones actuales

- Operación de pedidos, detalles de productos y cambios de estado.
- Registro con búsqueda, filtros y resúmenes diarios, semanales y mensuales.
- Top 3 de productos vendidos e ingresos de pedidos entregados, en MXN.
- Notificaciones de nuevos pedidos, cancelaciones y demoras.
- Sonido opcional, umbral de demora y modo claro/oscuro/automático.
- Preferencias por trabajador en este navegador y diseño adaptable.

Los avisos requieren mantener el panel abierto y Realtime conectado; no son push.
Los avisos de demora se conservan aunque se lean, hasta que el pedido esté listo,
entregado o cancelado. Menú, Promociones y Personal aún no están implementados.

## Comprobaciones

- `npm run lint`
- `npm run typecheck`
- `npm run test:reports`
- `npm run build`

Después de `build`, `npm run start` sirve la compilación de producción.

La clave `service_role` no se utiliza ni debe agregarse a este proyecto.
Consulta [SECURITY.md](SECURITY.md) para conocer las protecciones y ajustes pendientes.
