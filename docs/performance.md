# Rendimiento y limpieza

Revisión: 13 de septiembre de 2026. No se cambian las reglas de precios, promociones, cancelaciones ni permisos.

## Cambios aplicados

- Cliente: el catálogo consulta una revisión pequeña cada 3 segundos en Inicio/Menú. Solo descarga los productos completos si cambia la revisión. Las fotos mantienen su caché independiente.
- Historial y seguimiento: actualización cada 5 segundos, consultas simultáneas compartidas y pausa en segundo plano. Los pedidos entregados/cancelados se reutilizan en memoria durante esta sesión porque sus estados son finales; al reiniciar se consultan nuevamente.
- Las consultas fallidas conservan los pedidos visibles. Una respuesta anterior no sobrescribe una creación/cancelación reciente.
- Administrador: Realtime agrupa eventos durante 100 ms y consulta solo los pedidos afectados, en vez de recargar 100 pedidos por evento. Al volver a una pestaña visible se reconcilia la lista completa.
- Menú e historial del administrador se descargan bajo demanda, no al abrir Operación.
- Menú administrativo: lectura directa de Supabase sin el salto de Server Action (el catálogo ya es público bajo RLS); todas las escrituras siguen verificando administradores en servidor. Conserva tarjetas al cambiar de pestaña, actualiza al volver y muestra 12 por página para limitar fotos y DOM. Los filtros buscan en el catálogo completo.
- Metro y TypeScript excluyen el proyecto administrativo, el repositorio Git anidado `MasCafe` y las exportaciones. Se conserva el repositorio anidado y su historial.
- Importaciones directas de Ionicons: dejan de incluir 18 archivos de fuentes de familias no utilizadas.

## Mediciones

Con 65 productos, una respuesta completa del catálogo pesó **29 802 bytes**; la revisión, **58 bytes** (sin cabeceras). La descarga completa sigue siendo necesaria cuando hay cambios. La revisión depende de `updated_at`, que actualiza el editor administrativo; cualquier otro proceso que edite productos también debe actualizar ese campo.

Dos exportaciones iOS de producción en esta máquina:

- Antes de limitar las familias de iconos: **9 007 674 bytes**, incluidos recursos y metadatos.
- Después: **4 976 984 bytes**, aproximadamente **45 % menos**.
- Bytecode Hermes: aproximadamente **4.9 MB → 4.5 MB**.

Esto mide el contenido exportado, **no** el tamaño instalado ni el tiempo real de arranque en un teléfono. Las compilaciones simultáneas y OneDrive afectaron los tiempos de Metro; no se atribuye una mejora porcentual de arranque sin probar el mismo dispositivo y condiciones.

## Limpieza recuperable

Las exportaciones antiguas `work/ios-tabs-check` (13 673 338 bytes) se retiraron del proyecto. Copia recuperable:

`C:\Users\angsm\AppData\Local\Temp\MasCafe-export-backup-20260912`

No se borraron dependencias ni recursos solo por parecer duplicados: las variantes `storage.ts` y `storage.web.ts` son necesarias para diferenciar SQLite en móvil y almacenamiento del navegador. Los archivos no importados no aumentan por sí mismos el paquete ejecutable.

## Aplicar y comprobar

Reiniciar Metro una vez con `npx expo start --clear` para cargar la nueva configuración. No limpiar caché en cada arranque: obligaría a recompilar todo.

Pruebas: `node --test tests/*.test.mjs`, TypeScript en ambos proyectos, lint/build del administrador y exportaciones Expo iOS/web. Para medir apertura real, comparar varias aperturas en el mismo teléfono y distinguir primera descarga de aperturas con caché. Expo Go en desarrollo no representa el rendimiento de una compilación de producción.
