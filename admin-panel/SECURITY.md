# Seguridad del panel

El inicio de sesión se procesa en una Server Action: valida tipos y longitudes en servidor,
usa Supabase Auth sin concatenar SQL y comprueba que el usuario pertenece al personal activo.
Los mensajes no distinguen entre cuentas inexistentes, contraseñas incorrectas o acceso denegado.
Next.js verifica Origin/Host en Server Actions; no ampliar `allowedOrigins` sin necesidad.

Las autorizaciones de base de datos deben mantenerse en RLS y en las funciones RPC, no solo
en la interfaz. Nunca publicar una clave `service_role` en variables `NEXT_PUBLIC_*` o `EXPO_PUBLIC_*`.
La validación de texto no sustituye consultas parametrizadas ni RLS.

Se añaden CSP, bloqueo de iframes, `nosniff`, política de permisos y protección del referente.
La CSP permite scripts inline por compatibilidad con Next.js; no garantiza bloquear todo XSS.
Una futura CSP con nonce requiere adaptar el proxy y verificar todas las rutas.

## Antes de publicar

- Usar HTTPS y configurar los límites de Supabase Auth según el tráfico real.
- Activar CAPTCHA con verificación en Supabase y pasar su token al login si hay abuso.
- Configurar MFA para personal privilegiado y exigir AAL2 en las políticas/RPC; activar MFA
  sin exigirlo en servidor no basta.
- Supervisar registros de autenticación y mantener dependencias actualizadas.
- No usar un contador en memoria como único límite de intentos: no se comparte entre réplicas.

Estos ajustes de Supabase no se modificaron automáticamente. El login reconoce respuestas
429 de sus límites actuales. El campo señuelo es solo una barrera adicional para bots simples.

Referencias: [Supabase rate limits](https://supabase.com/docs/guides/auth/rate-limits),
[seguridad de datos en Next.js](https://nextjs.org/docs/app/guides/data-security).
