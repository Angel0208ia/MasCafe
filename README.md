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

Se requiere Node.js **24 LTS**, npm y un proyecto de Supabase. Después de clonar el repositorio:

```bash
git clone https://github.com/Angel0208ia/MasCafe.git
cd MasCafe
npm ci
```

Cada aplicación utiliza su propio archivo de entorno. Desde la carpeta `MasCafe`, crear ambos archivos con PowerShell:

```powershell
Copy-Item .env.example .env.local
Copy-Item admin-panel/.env.example admin-panel/.env.local
```

La ubicación final debe quedar así:

```text
MasCafe/
├── .env.local                  ← panel de usuario
└── admin-panel/
    └── .env.local              ← panel administrativo
```

En `MasCafe/.env.local`, colocar las variables públicas del **panel de usuario**:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

En `MasCafe/admin-panel/.env.local`, colocar las variables públicas del **panel administrativo**:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

Ambos archivos deben apuntar al mismo proyecto de Supabase. El repositorio no incluye credenciales reales y los archivos `.env.local` no deben subirse a GitHub.

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

1. Instalar Expo Go compatible con **Expo SDK 57**.
2. Conectar el teléfono y la computadora a la misma red Wi-Fi.
3. Escanear el QR desde Expo Go en Android o con la cámara en iPhone.

Si la red local bloquea la conexión, detener Expo con `Ctrl+C` y usar:

```bash
npx expo start --tunnel
```

El túnel es más lento, pero resuelve la mayoría de los bloqueos de red. Consulta la [guía oficial de Expo](https://docs.expo.dev/get-started/start-developing/) si el QR no abre la aplicación.

### 3. Abrir el panel administrativo

Abrir **otra terminal** y ejecutar:

```bash
cd admin-panel
npm ci
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). El acceso exige una cuenta existente en Supabase con perfil activo y rol `business` o `admin`; el repositorio no publica usuarios ni contraseñas.

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

Por ejemplo: `http://192.168.1.25:3000`. Windows puede solicitar permiso para que Node.js se comunique en redes privadas.

### Inicio simultáneo recomendado

Mantener dos terminales abiertas:

```text
Terminal 1 — raíz del repositorio: npm run web
Terminal 2 — admin-panel/:       npm run dev
```

Con ambas aplicaciones abiertas se puede generar un pedido en el cliente y observar su llegada y cambios de estado en el panel administrativo.

### Notas de ejecución

- La geolocalización se solicita al generar el pedido y Supabase vuelve a validar que esté dentro del campus.
- Las notificaciones locales funcionan al detectar que el pedido está listo. El push con la aplicación completamente cerrada todavía está fuera del alcance; consulta [`expo-notifications` para SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/).
- En web, la ubicación requiere `localhost` o HTTPS.

## Funciones

### Aplicación de cliente

- Menú con búsqueda, categorías, imágenes y promociones.
- Personalización de productos, notas, cantidades y carrito de hasta tres artículos.
- Geolocalización obligatoria dentro de Tecmilenio Campus Cancún.
- Historial, detalle, seguimiento, cancelación y opción **Pedir de nuevo**.
- Aviso local cuando el pedido pasa a **Listo**.

### Panel de negocio

- Inicio de sesión para personal activo con rol `business` o `admin`.
- Pedidos en vivo y cambios de estado validados por PostgreSQL.
- Historial, búsqueda, avisos y reportes diarios, semanales y mensuales.
- Apertura y cierre de la cafetería.
- Administración de productos, disponibilidad, imágenes, opciones y promociones.
- Preferencias de sonido, alertas y tema visual.

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

## Configurar Supabase

Para una **base nueva**, ejecutar en el SQL Editor en este orden:

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

Para una base existente, aplicar solo los archivos incrementales que falten y revisar las migraciones ya ejecutadas, incluida `202609170001_complete_mvp_checklist.sql` después de `admin-panel.sql`. No volver a ejecutar el seed: sobrescribe modificaciones. La app cliente actualiza el catálogo al volver a cargarlo, con caché de hasta 60 segundos; los pedidos históricos conservan sus productos, precios e imágenes originales aunque se elimine un artículo.

**No ejecutar otra vez `schema.sql` sobre una base existente**: contiene creación de tablas y tipos, no es una migración incremental. Revisar los cambios necesarios antes de aplicar `apply-promotions.sql` o `customer-cancellations.sql`. El seed actualiza productos y puede sobrescribir cambios del catálogo.

Crear el primer administrador siguiendo [`docs/admin-panel.md`](docs/admin-panel.md). Una cuenta de Auth sin perfil activo en `staff_members` no puede ingresar. Realtime debe estar habilitado para `public.orders`.

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
