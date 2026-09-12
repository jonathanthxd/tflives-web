# analytics

Analítica first-party y observabilidad ligera de v0.11. El panel administrativo
agrega tablas operativas para métricas históricas y solo persiste eventos cuando
la acción no deja un historial suficiente (`PROFILE_COMPLETED` y
`COSMETIC_EQUIPPED`). Nunca almacena texto de chats/DMs, correos, tokens, IPs ni
payloads de solicitudes.

`purgeExpiredAnalyticsData()` es el helper seguro para una tarea de
mantenimiento autenticada: elimina eventos raw con más de 90 días y errores
resueltos/ignorados con más de 365 días. No hay un cron ni endpoint público
incluido; el equipo de despliegue debe invocarlo desde su mecanismo protegido.
