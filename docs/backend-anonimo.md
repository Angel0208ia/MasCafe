# Backend anónimo de Más Café

## Decisión de privacidad

El sistema no solicita ni almacena nombres, correos, teléfonos, matrículas,
fotografías, direcciones, cuentas ni identificadores de dispositivo. El número
de recogida identifica al pedido, no a una persona.

Cada pedido tiene dos identificadores:

- `pickup_code` (`MC-001000`): se muestra al estudiante y al personal para la entrega.
- `tracking_token` (UUID aleatorio): se guarda sólo de forma local en el teléfono
  para que pueda consultar el estado de su propio pedido. Nunca se muestra en la interfaz.

Un código corto no se usa para consultar la API porque otra persona podría adivinarlo.

## Primera puesta en marcha

1. Una persona del equipo crea un proyecto en Supabase.
2. En **SQL Editor**, ejecuta el archivo `supabase/schema.sql` completo.
3. Copia `.env.example` como `.env.local` y completa `EXPO_PUBLIC_SUPABASE_URL`
   y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. No compartan ni agreguen a la app la clave `service_role` ni la contraseña
   de PostgreSQL.

## Activar promociones en una base existente

El archivo `supabase/schema.sql` ya incluye las promociones para instalaciones
nuevas. Si la base de datos ya estaba funcionando, ejecuta una vez
`supabase/apply-promotions.sql` en **Supabase Dashboard > SQL Editor**.

El servidor valida la promoción con la zona horaria `America/Cancun` y calcula
el descuento usando los productos reales del pedido:

- Martes: dos cappuccinos; el segundo queda en $45.
- Jueves: brownie + matcha por $90.

Los extras de personalización conservan su precio y el teléfono nunca decide el
total final del pedido.
