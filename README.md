# Más Café ☕

Sistema de pedidos para una cafetería universitaria: aplicación de cliente para Android, iOS y web, y panel web de negocio. Ambos utilizan el mismo proyecto de Supabase.

Todos los importes se manejan en **pesos mexicanos (MXN)**. El sistema registra pedidos y sus totales; no integra una pasarela de pago.

## Abrir la aplicación

El proyecto contiene dos aplicaciones independientes que comparten la misma base de datos:

| Aplicación | Carpeta de ejecución | Dirección habitual |
| --- | --- | --- |
| Cliente o panel de usuario | Raíz del repositorio | [http://localhost:8081](http://localhost:8081) |
| Panel administrativo | `admin-panel/` | [http://localhost:3000](http://localhost:3000) |

### 1. Preparación inicial

Se requiere Node.js **24 LTS**, npm y las variables públicas de un proyecto de Supabase. Después de clonar el repositorio:

```bash
git clone https://github.com/Angel0208ia/MasCafe.git
cd MasCafe
npm ci
```

Copiar `.env.example` como `.env.local` y completar únicamente las variables públicas:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

El repositorio no incluye credenciales reales. No se deben subir `.env.local`, contraseñas, claves `service_role` ni tokens de seguimiento.

### 2. Abrir el panel de usuario

#### En navegador

Desde la raíz del repositorio:

```bash
npm run web
```

Esperar a que Expo termine de compilar y abrir [http://localhost:8081](http://localhost:8081). Si el puerto está ocupado, la terminal mostrará la dirección alternativa.

#### En Android o iPhone

Desde la raíz del repositorio:

```bash
npm start
```

1. Instalar una versión de Expo Go compatible con **Expo SDK 57**.
2. Conectar el teléfono y la computadora a la misma red Wi-Fi.
3. Escanear el QR mostrado por Expo. En Android se escanea desde Expo Go; en iPhone puede usarse la cámara.
4. Mantener abierta la terminal mientras se utiliza la aplicación.

Si la red local bloquea la conexión, detener Expo con `Ctrl+C` y usar:

```bash
npx expo start --tunnel
```

El túnel suele ser más lento, pero permite abrir el proyecto cuando el teléfono no puede comunicarse directamente con la computadora. En iPhone físico, Expo puede pedir que Expo CLI y Expo Go tengan iniciada la misma cuenta. Consulta la [guía oficial para iniciar un proyecto Expo](https://docs.expo.dev/get-started/start-developing/) si el QR no abre la aplicación.

Expo Go permite revisar el flujo principal y las notificaciones locales. Las [notificaciones push remotas en Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) requieren una compilación de desarrollo; este proyecto todavía no envía push cuando la aplicación está completamente cerrada.

### 3. Abrir el panel administrativo

Abrir **otra terminal** y ejecutar:

```bash
cd admin-panel
npm ci
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). El acceso utiliza Supabase Auth y exige una cuenta existente con perfil activo y rol `business` o `admin`; este README no publica credenciales.

En desarrollo, el panel reutiliza las variables públicas del `.env.local` de la raíz. Como alternativa, se puede copiar `admin-panel/.env.example` como `admin-panel/.env.local` y completar:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

#### Abrir el panel administrativo desde otro dispositivo

Para mostrar el panel desde un teléfono u otra computadora conectada a la misma red:

```bash
cd admin-panel
npm run dev -- --hostname 0.0.0.0
```

Consultar la dirección IPv4 de la computadora con `ipconfig` en Windows y abrir desde el otro dispositivo:

```text
http://DIRECCION-IP-DE-LA-COMPUTADORA:3000
```

Por ejemplo, si la computadora tiene la IP `192.168.1.25`, la dirección sería `http://192.168.1.25:3000`. Windows puede solicitar permiso para que Node.js se comunique en redes privadas. No es necesario cambiar ni publicar credenciales para acceder desde la red local.

### Inicio simultáneo recomendado

Mantener dos terminales abiertas:

```text
Terminal 1 — raíz del repositorio: npm run web
Terminal 2 — admin-panel/:       npm run dev
```

Con ambas aplicaciones abiertas se puede generar un pedido en el cliente y observar su llegada y cambios de estado en el panel administrativo.

## Funciones

### Aplicación de cliente

- Menú con búsqueda y filtros por categoría.
- Personalización de tamaños, sabores, leche, temperatura y extras compatibles.
- Notas especiales, cantidades y edición de opciones desde el carrito.
- Promociones por día, aplicadas al combinar los artículos correspondientes.
- Historial, detalle del pedido y seguimiento de su estado.
- Aviso del sistema cuando un pedido pasa a **Listo**, con acceso al detalle. La aplicación solicita permiso al generar el primer pedido.
- Validación de ubicación al generar el pedido: únicamente se aceptan solicitudes dentro de Tecmilenio Campus Cancún y con precisión suficiente.
- “Pedir de nuevo”, validando productos disponibles, promociones y capacidad del carrito.
- Cancelación mientras el pedido esté en **Recibido**.
- Imágenes con caché y alternativa visual cuando no hay fotografía.

### Panel de negocio

- Acceso mediante Supabase Auth para personal activo con rol `business` o `admin`.
- Operación y cambios de estado validados por PostgreSQL, con actualización en vivo.
- Registro con búsqueda, fecha, estado y detalles de productos, opciones y notas.
- Resúmenes diarios, semanales y mensuales: pedidos, ingresos y los 3 productos más vendidos.
- Notificaciones de nuevos pedidos, cancelaciones y demoras; acceso al pedido y lectura individual o masiva.
- Configuración de sonidos, alertas y tiempo de demora.
- Modo claro, oscuro o automático, preferencias por trabajador y diseño adaptable.

- Menú: crear, editar y eliminar artículos, categorías y grupos de opciones. Botón de disponibilidad verde/rojo, solo administradores. Los agotados permanecen opacos en el cliente y no pueden abrirse ni agregarse al carrito.
- Fotografías desde el dispositivo, optimizadas a WebP (máximo 1200 px y 2 MB), almacenadas en Supabase Storage.
- Promociones: crear, editar y eliminar combos, precios y días de vigencia desde el panel.

La pestaña **Personal** se retiró de la navegación; las cuentas y roles se administran en Supabase.

## Reglas del negocio

- Máximo de **3 artículos por pedido**, contando cantidades.
- Espera normal de **30 minutos** entre pedidos, controlada actualmente por la aplicación cliente.
- La primera cancelación permite pedir inmediatamente; el pedido nuevo inicia otra espera de 30 minutos.
- Desde la segunda cancelación del cliente se aplica un bloqueo de **2 horas**, validado también en el servidor.
- No se puede cancelar un pedido que ya esté en preparación.
- Los cancelados desaparecen de las listas del panel de negocio, pero permanecen en la base de datos.

```text
Recibido → Preparando → Listo → Entregado
    └──→ Cancelado
```

Los reportes usan la fecha de creación del pedido y la zona horaria `America/Cancun`. Las semanas van de lunes a domingo. La cantidad excluye cancelados; los ingresos y el top de productos incluyen **solo pedidos entregados**, usando el total después de promociones. No representan comprobantes de pago.

Promociones configuradas:

- **Martes:** dos cappuccinos por $105 MXN; el segundo queda en $45 MXN.
- **Jueves:** brownie + matcha por $90 MXN.

Las personalizaciones con cargo conservan su precio. Supabase valida productos, opciones y descuentos; el cliente no decide el total definitivo.

## Tecnologías

| Cliente | Panel de negocio | Backend |
| --- | --- | --- |
| Expo SDK 57, React Native y Expo Router | Next.js 16 y React | Supabase y PostgreSQL |
| TypeScript y Zustand | TypeScript y CSS Modules | Auth, RLS, RPC y Realtime |

## Requisitos

- Node.js **24 LTS** para ejecutar también las pruebas que importan TypeScript directamente.
- npm y un proyecto de Supabase con sus credenciales públicas.
- Expo Go compatible o un emulador para desarrollo móvil.

## Configurar Supabase

Para una **base nueva**, ejecutar en el SQL Editor en este orden:

1. [`supabase/schema.sql`](supabase/schema.sql): catálogo, pedidos, seguimiento, promociones y cancelaciones de clientes.
2. [`supabase/admin-panel.sql`](supabase/admin-panel.sql): personal, permisos y seguimiento del negocio.
3. [`supabase/customer-cancellations.sql`](supabase/customer-cancellations.sql): reglas de cancelación y transiciones del negocio.
4. [`supabase/seed-products.sql`](supabase/seed-products.sql): catálogo inicial.
5. [`supabase/menu-management.sql`](supabase/menu-management.sql): permisos de administración del catálogo y bucket público `menu-images` para fotos de productos, con escritura exclusiva de administradores.
6. [`supabase/promotions-management.sql`](supabase/promotions-management.sql): administración de promociones.
7. [`supabase/weekly-best-sellers.sql`](supabase/weekly-best-sellers.sql): ranking semanal mostrado cuando no hay promociones vigentes.
8. [`supabase/migrations/202609150001_harden_function_privileges.sql`](supabase/migrations/202609150001_harden_function_privileges.sql): permisos mínimos de funciones públicas.
9. [`supabase/migrations/202609170001_complete_mvp_checklist.sql`](supabase/migrations/202609170001_complete_mvp_checklist.sql): cafetería abierta/cerrada, productos activos, instantáneas de imágenes y actualizaciones de pedidos en tiempo real.
10. [`supabase/migrations/202609200001_enforce_campus_geofence.sql`](supabase/migrations/202609200001_enforce_campus_geofence.sql): exige una ubicación válida dentro del perímetro de Tecmilenio Campus Cancún antes de crear pedidos.

Para una base existente, aplicar solo los archivos incrementales que falten y revisar las migraciones ya ejecutadas, incluida `202609170001_complete_mvp_checklist.sql` después de `admin-panel.sql`. No volver a ejecutar el seed: sobrescribe modificaciones. La app cliente actualiza el catálogo al volver a cargarlo, con caché de hasta 60 segundos; los pedidos históricos conservan sus productos, precios e imágenes originales aunque se elimine un artículo.

**No ejecutar otra vez `schema.sql` sobre una base existente**: contiene creación de tablas y tipos, no es una migración incremental. Revisar los cambios necesarios antes de aplicar `apply-promotions.sql` o `customer-cancellations.sql`. El seed actualiza productos y puede sobrescribir cambios del catálogo.

Crear el primer administrador siguiendo [`docs/admin-panel.md`](docs/admin-panel.md). Una cuenta de Auth sin perfil activo en `staff_members` no puede ingresar. Realtime debe estar habilitado para `public.orders` para recibir cambios y avisos en vivo.

### Variables de entorno

La configuración inicial y los nombres de las variables públicas están descritos en [Abrir la aplicación](#abrir-la-aplicación). Los archivos `.env.local`, las contraseñas, las claves `service_role` y los tokens de seguimiento deben permanecer fuera del repositorio.

## Ejecutar en desarrollo

Las instrucciones completas se encuentran en [Abrir la aplicación](#abrir-la-aplicación). Desde Expo CLI, `a` abre Android y `w` abre web.

Las notificaciones locales de pedidos usan `expo-notifications`. Android e iOS necesitan una nueva compilación de desarrollo o producción después de agregar el plugin nativo. En web se usa la API de notificaciones del navegador. Estos avisos se generan cuando la aplicación abierta recibe el cambio por Realtime o cuando recupera un pedido listo al volver a abrirse; las notificaciones con la aplicación completamente cerrada requieren configurar push remoto, credenciales APNs/FCM y, para web, un service worker con Web Push.

La ubicación se solicita al pulsar **Generar pedido**. El cliente comprueba el perímetro del campus y Supabase repite la validación antes de crear el pedido; las coordenadas se usan para esta comprobación y no se guardan. En web, la ubicación requiere `https` o `localhost`. Android e iOS necesitan una nueva compilación después de agregar `expo-location` y su texto de permiso nativo.

Dirección habitual del cliente web: [http://localhost:8081](http://localhost:8081). Expo puede ofrecer otro puerto si está ocupado. El panel de negocio utiliza [http://localhost:3000](http://localhost:3000).

## Verificaciones y compilación

Desde la raíz:

```bash
npm run typecheck
npx expo-doctor
node --test tests/*.test.mjs
```

Desde `admin-panel`:

```bash
npm run typecheck
npm run lint
npm run test:reports
npm run build
```

`npm run start` dentro del panel sirve su compilación de producción después de `build`. Para exportar el cliente web: `npx expo export --platform web`.

## Estructura

```text
src/
  app/(tabs)/            Inicio, menú, carrito e historial
  app/products/[id].tsx  Detalle y personalización del producto
  app/orders/[id].tsx    Detalle y seguimiento del pedido
  components/           Componentes reutilizables del cliente
  constants/            Diseño, promociones e imágenes
  data/products.json    Catálogo de respaldo visual
  lib/                  Supabase, pedidos y almacenamiento
  store/                Estado global de menú, carrito y pedidos
  types/                Tipos del dominio
admin-panel/             Aplicación web independiente del negocio
supabase/                Esquema, catálogo y actualizaciones SQL
docs/                    Guías de configuración
tests/                   Pruebas de almacenamiento y espera entre pedidos
```

## Seguridad y límites actuales

Consulta la [revisión de rendimiento](docs/performance.md) para los refrescos optimizados, mediciones y limpieza recuperable.

- El SDK y las RPC se utilizan sin concatenar SQL con entradas del formulario.
- El login valida datos y personal activo en servidor; RLS y las funciones SQL controlan el acceso y las transiciones.
- El panel incluye cabeceras de seguridad y CSP. Esto **no garantiza inmunidad a ataques**. CAPTCHA, MFA y ajustes de límites requieren configuración adicional en Supabase: ver [`admin-panel/SECURITY.md`](admin-panel/SECURITY.md).
- El cliente no requiere cuenta ni datos personales obligatorios. Guarda tokens anónimos localmente para seguimiento, cancelación y sanciones. Borrar el almacenamiento puede perder el historial local y la identidad anónima; no equivale a autenticación de usuario.
- Las preferencias del trabajador se guardan por cuenta en ese navegador. Las notificaciones pertenecen a la sesión: no son push y requieren el panel abierto y conectado a Realtime.
- El sonido necesita un clic para habilitarse en cada sesión. Los avisos leídos se eliminan, excepto los de demora: permanecen hasta que el pedido esté listo, entregado o cancelado.
- El catálogo incluido permite explorar sin conexión; generar un pedido requiere conexión y productos válidos en Supabase.

## Problemas frecuentes

- **Puerto ocupado:** cerrar el proceso correcto o elegir otro puerto. Cliente y negocio son servidores distintos.
- **Error antiguo tras un cambio:** detener Expo con `Ctrl+C` e iniciar `npx expo start --clear`.
- **`localStorage is not defined`:** usar las lecturas seguras de `src/lib/storageAccess.ts`; no acceder al almacenamiento del navegador al importar módulos.
- **Sin avisos en vivo:** comprobar Realtime, sesión del trabajador y políticas RLS.
- **Sin acceso al negocio:** revisar que la cuenta de Auth tenga perfil activo en `staff_members` y que ambas aplicaciones apunten a la misma base.

Más información: [`docs/backend-anonimo.md`](docs/backend-anonimo.md), [`docs/admin-panel.md`](docs/admin-panel.md) y [`admin-panel/README.md`](admin-panel/README.md).

Gestión de promociones y migración necesaria: [`docs/promotions.md`](docs/promotions.md).
