# Más Café ☕

Sistema de pedidos para una cafetería universitaria. Incluye una aplicación cliente para Android, iOS y web, un panel administrativo web y una base de datos compartida en Supabase.

| Aplicación | Carpeta | Dirección local |
| --- | --- | --- |
| Panel de usuario | Raíz del repositorio | [http://localhost:8081](http://localhost:8081) |
| Panel administrativo | `admin-panel/` | [http://localhost:3000](http://localhost:3000) |

## Requisitos

- Git.
- Node.js **24 LTS** y npm.
- Acceso a la URL y la publishable key del proyecto de Supabase ya configurado.
- Una cuenta activa del personal para ingresar al panel administrativo.
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

### 2. Crear los archivos de entorno

La base de datos del proyecto ya está creada y configurada. Solicitar al responsable del proyecto la URL de Supabase y la **publishable key**, o consultarlas en el diálogo **Connect** o en **Settings > API Keys** si se tiene acceso al panel. No usar una secret key ni `service_role`.

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

Abrir [http://localhost:8081](http://localhost:8081). La primera compilación después de `npm ci` puede tardar algunos minutos. Si el puerto está ocupado, Expo mostrará la dirección alternativa.

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

Abrir [http://localhost:3000](http://localhost:3000) e iniciar sesión con una cuenta activa del personal. Si el puerto `3000` está ocupado, Next.js mostrará otra dirección, por ejemplo `http://localhost:3001`; se debe abrir exactamente la URL indicada en la terminal.

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
- **El panel rechaza el acceso:** confirmar con el responsable que la cuenta exista y esté activa para el proyecto.
- **El QR no abre:** comprobar la misma red Wi-Fi o usar `npx expo start --tunnel`.
- **Puerto ocupado:** usar la dirección alternativa que muestra Expo o cerrar el proceso del puerto `3000`.
- **Cambios antiguos en Expo:** detener el servidor y ejecutar `npx expo start --clear`.
- **No llegan pedidos en vivo:** comprobar que ambas aplicaciones utilicen la misma URL y publishable key de Supabase.

Documentación adicional: [`docs/backend-anonimo.md`](docs/backend-anonimo.md), [`docs/admin-panel.md`](docs/admin-panel.md), [`docs/promotions.md`](docs/promotions.md), [`docs/performance.md`](docs/performance.md) y [`admin-panel/SECURITY.md`](admin-panel/SECURITY.md).
