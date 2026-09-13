# Gestión de promociones

En el panel de negocio, la pestaña **Promociones** permite crear, editar, desactivar y eliminar combos. Solo administradores activos pueden modificarlos; el personal puede consultarlos.

## Instalación

Ejecutar `supabase/promotions-management.sql` en Supabase SQL Editor después de las migraciones del menú. La transacción crea la tabla y sus políticas RLS, conserva las dos promociones originales y modifica únicamente el cálculo de descuentos de la función existente. Si no reconoce esa función, cancela la transacción sin cambios. No sustituye las validaciones de pedidos, las cancelaciones ni los bloqueos.

Migración aplicada al proyecto `dfmoqjfuhsptdakiptdw`. Soporta también la variante de pedidos con `daily_order_counter`, conservando su numeración diaria e insertando el descuento antes de guardar el total.

Instalar esta migración **después** de `schema.sql` y `apply-promotions.sql`; reinstalar esos archivos antiguos después restauraría los descuentos fijos.

## Reglas

- Día de vigencia: domingo a sábado, zona horaria America/Cancun.
- Máximo 3 artículos por combo, conforme al límite actual de pedidos.
- Descuento fijo en pesos mexicanos, no mayor al precio base del combo.
- Las opciones y extras se cobran normalmente.
- Se aplican automáticamente al reunir los artículos en el carrito; no es necesario entrar por la tarjeta de promoción.
- Si varias promociones usan los mismos artículos, se elige la combinación de mayor ahorro sin descontarlos dos veces.
- Los productos inexistentes o no disponibles invalidan el combo.
- El servidor calcula el total desde productos y promociones de la base de datos, nunca desde precios enviados por el cliente.
- Editar o eliminar promociones no cambia los totales de pedidos anteriores.

El cliente actualiza las promociones al refrescar su catálogo y al abrir el carrito. Hasta instalar la migración, mantiene las promociones antiguas. Las escrituras del panel fallan con un mensaje de instalación pendiente; no hay un almacenamiento local ficticio.

Verificación del cálculo: `node --test tests/promotions.test.mjs`.
