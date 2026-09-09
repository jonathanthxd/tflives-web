# Realtime transport

TFLives no depende de un proveedor de realtime externo en esta etapa.

- Mensajería: refresco incremental por polling desde las APIs de Next.js.
- Notificaciones: polling periódico y refresco al volver a enfocar la pestaña.
- Fuente de verdad: PostgreSQL (Neon) mediante Prisma.

Esta carpeta queda reservada para sustituir el polling por WebSocket/SSE cuando
la escala del proyecto lo justifique, sin acoplar los módulos de dominio a un
proveedor concreto.
