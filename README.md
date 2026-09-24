# Más Café ☕

Sistema de pedidos para una cafetería universitaria. Incluye una aplicación cliente para Android, iOS y web, un panel administrativo web y una base de datos compartida en Supabase.

| Aplicación | Carpeta | Dirección local |
| --- | --- | --- |
| Panel de usuario | Raíz del repositorio | [http://localhost:8081](http://localhost:8081) |
| Panel administrativo | `admin-panel/` | [http://localhost:3000](http://localhost:3000) |

## Requisitos

- Git.
- Node.js **24 LTS** y npm.
- Un proyecto de [Supabase](https://supabase.com/dashboard).
- Expo Go compatible con **Expo SDK 57** para probar en un teléfono.

## Instalación completa

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/Angel0208ia/MasCafe.git
cd MasCafe
npm ci
npm --prefix admin-panel ci
```

Todos los comandos siguientes parten de la carpeta `MasCafe`.

### 2. Configurar la base de datos

Crear un proyecto en Supabase. En **SQL Editor**, ejecutar estos archivos completos y en el orden indicado:

1. [`supabase/schema.sql`](supabase/schema.sql)
2. [`supabase/admin-panel.sql`](supabase/admin-panel.sql)
3. [`supabase/customer-cancellations.sql`](supabase/customer-cancellations.sql)
4. [`supabase/seed-products.sql`](supabase/seed-products.sql)
5. [`supabase/menu-management.sql`](supabase/menu-management.sql)
6. [`supabase/promotions-management.sql`](supabase/promotions-management.sql)
7. [`supabase/weekly-best-sellers.sql`](supabase/weekly-best-sellers.sql)
8. [`supabase/migrations/202609150001_harden_function_privileges.sql`](supabase/migrations/202609150001_harden_function_privileges.sql)
9. [`supabase/migrations/202609170001_complete_mvp_checklist.sql`](supabase/migrations/202609170001_complete_mvp_checklist.sql)
10. [`supabase/migrations/202609200001_enforce_campus_geofence.sql`](supabase/migrations/202609200001_enforce_campus_geofence.sql)

Esta secuencia crea el catálogo, pedidos, promociones, permisos, Realtime, almacenamiento de imágenes y geocerca. Para una base existente, aplicar solamente los archivos que falten. No volver a ejecutar `schema.sql` ni `seed-products.sql`, porque pueden entrar en conflicto con el esquema o sobrescribir el catálogo.

### 3. Crear el primer administrador

1. En Supabase, abrir **Authentication > Users**.
2. Seleccionar **Add user** y crear un usuario con correo y contraseña.
3. Reemplazar únicamente el correo de ejemplo en este bloque y ejecutarlo en **SQL Editor**:

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

El rol `admin` puede gestionar menú y promociones. El rol `business` puede operar pedidos. El repositorio no contiene cuentas ni contraseñas.

### 4. Crear los archivos de entorno

En Supabase, abrir el diálogo **Connect** o **Settings > API Keys** y copiar la URL del proyecto y la **publishable key**. No usar una secret key ni `service_role`.

Desde `MasCafe`, crear los dos archivos con PowerShell:

```powershell
Copy-Item .env.example .env.local
Copy-Item admin-panel/.env.example admin-panel/.env.local
```

La estructura debe quedar así:

```text
MasCafe/
├── .env.local                  ← panel de usuario
└── admin-panel/
    └── .env.local              ← panel administrativo
```

Contenido de `MasCafe/.env.local`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

Contenido de `MasCafe/admin-panel/.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

Los dos archivos deben usar el mismo proyecto de Supabase. `.env.local` está ignorado por Git y nunca debe contener una secret key, una contraseña o una clave `service_role`.

## Ejecutar el proyecto

### Panel de usuario en web

Desde la raíz `MasCafe`:

```bash
npm run web
```

Abrir [http://localhost:8081](http://localhost:8081). Si el puerto está ocupado, Expo mostrará la dirección alternativa.

### Panel de usuario en Android o iPhone

Desde la raíz `MasCafe`:

```bash
npm start
```

Conectar el teléfono y la computadora a la misma red Wi-Fi y escanear el QR. En Android se usa Expo Go; en iPhone se puede usar la cámara.

Si el QR no conecta, detener Expo con `Ctrl+C` y ejecutar:

```bash
npx expo start --tunnel
```

El túnel es más lento, pero funciona cuando la red local bloquea la conexión. Consulta la [guía oficial de Expo](https://docs.expo.dev/get-started/start-developing/) para más opciones.

### Panel administrativo

Abrir otra terminal desde `MasCafe`:

```bash
cd admin-panel
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) e iniciar sesión con el usuario creado en Supabase.

Para abrir el panel desde otro dispositivo de la misma red:

```bash
cd admin-panel
npm run dev -- --hostname 0.0.0.0
```

Consultar la IPv4 de la computadora con `ipconfig` y abrir `http://IP-DE-LA-COMPUTADORA:3000`. Por ejemplo: `http://192.168.1.25:3000`.

### Ejecutar ambos paneles

```text
Terminal 1 — MasCafe/:             npm run web
Terminal 2 — MasCafe/admin-panel/: npm run dev
```

Con ambos abiertos, un pedido creado en el cliente debe aparecer en vivo en el panel administrativo.

## Funciones principales

### Cliente

- Menú con búsqueda, categorías, imágenes y promociones.
- Personalización, notas, cantidades y carrito de hasta tres artículos.
- Geolocalización obligatoria dentro de Tecmilenio Campus Cancún.
- Historial, seguimiento, cancelación y opción **Pedir de nuevo**.
- Notificación local cuando el pedido pasa a **Listo**.

### Administración

- Pedidos en vivo y transiciones de estado validadas por PostgreSQL.
- Apertura y cierre de la cafetería.
- Historial, búsqueda, avisos y reportes.
- Gestión de productos, imágenes, opciones, disponibilidad y promociones.
- Roles `business` y `admin` mediante Supabase Auth.

## Reglas principales

- Máximo de **3 artículos por pedido**.
- Espera normal de **30 minutos** entre pedidos.
- Desde la segunda cancelación se aplica un bloqueo de **2 horas**.
- Un pedido en preparación ya no puede cancelarse.
- Los pedidos cancelados permanecen en la base de datos.
- PostgreSQL recalcula precios y promociones; el cliente no decide el total final.

```text
Generado → En preparación → Listo → Entregado
    └──→ Cancelado
```

Los importes se expresan en pesos mexicanos. El sistema no incluye pasarela de pago.

## Tecnologías

| Cliente | Panel administrativo | Backend |
| --- | --- | --- |
| Expo SDK 57, React Native, Expo Router y Zustand | Next.js 16, React y TypeScript | Supabase, PostgreSQL, Auth, RLS, RPC, Realtime y Storage |

## Verificación

Cliente, desde `MasCafe`:

```bash
npm run typecheck
npm run lint
npx expo-doctor
node --test tests/*.test.mjs
```

Panel administrativo, desde `MasCafe/admin-panel`:

```bash
npm run typecheck
npm run lint
npm run test:reports
npm run build
```

## Consideraciones

- La ubicación se solicita al generar el pedido. Las coordenadas se validan en cliente y servidor y no se guardan.
- En web, la ubicación requiere `localhost` o HTTPS.
- Las notificaciones actuales se generan cuando la aplicación detecta el estado **Listo**. El push con la aplicación completamente cerrada requiere infraestructura adicional; consulta [`expo-notifications` para SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/).
- El historial del cliente depende del almacenamiento local anónimo. Borrarlo puede eliminar el acceso local a pedidos anteriores.
- Las imágenes del menú se guardan en el bucket público `menu-images`; solo un administrador activo puede modificarlas.

## Estructura

```text
src/                         Aplicación cliente
admin-panel/                 Panel administrativo
supabase/                    Esquema, datos iniciales y migraciones
docs/                        Documentación adicional
tests/                       Pruebas del cliente
```

## Problemas frecuentes

- **Faltan variables de Supabase:** comprobar la ubicación y los nombres de ambos `.env.local`, y reiniciar los servidores.
- **El panel rechaza el acceso:** confirmar que el usuario exista en Auth y tenga un registro activo en `staff_members`.
- **El QR no abre:** comprobar la misma red Wi-Fi o usar `npx expo start --tunnel`.
- **Puerto ocupado:** usar la dirección alternativa que muestra Expo o cerrar el proceso del puerto `3000`.
- **Cambios antiguos en Expo:** detener el servidor y ejecutar `npx expo start --clear`.
- **No llegan pedidos en vivo:** comprobar que ambas aplicaciones usen el mismo proyecto y que `admin-panel.sql` haya terminado correctamente.

Documentación adicional: [`docs/backend-anonimo.md`](docs/backend-anonimo.md), [`docs/admin-panel.md`](docs/admin-panel.md), [`docs/promotions.md`](docs/promotions.md), [`docs/performance.md`](docs/performance.md) y [`admin-panel/SECURITY.md`](admin-panel/SECURITY.md).
