# Dynamic Profile Cards — v0.19

## URL y metadata

`/{es|en}/perfil/{username}/opengraph-image` sirve PNG de 1200 × 630. Es un route handler explícito; la página asigna esa URL a Open Graph y Twitter. Los aliases se resuelven a la identidad actual y su metadata apunta a la imagen canónica. No se alteran el OG general de la portada ni las rutas de perfil. Compartir usa Web Share cuando está disponible y copia el enlace del perfil como alternativa.

## Proyección pública

La consulta anónima selecciona identidad pública, seguidores, logros de progresión, premios de catálogo activos y cosméticos equipados elegibles. Cuenta únicamente reacciones con `targetType=PROFILE`. No consulta cartera, email, sesión, mensajes, roles ni permisos de administración. No reconcilia ni otorga logros al leer una tarjeta. Un perfil real sin datos muestra cero; un perfil inexistente responde 404, nunca una identidad ficticia con métricas inventadas.

El acento equipado determina la paleta; banner y marco son alternativas. El marco tiene una adaptación SVG estática apropiada para Satori, sin intentar importar animaciones DOM al renderer de imágenes. El logo es el recurso local existente. Los nombres tienen longitud acotada; métricas grandes usan formato compacto por locale. TFL Coins son privadas conforme a `docs/TFLIVES_V0.7_TFL_ECONOMY.md`, por lo que se rotulan Privado/Private.

## Avatares y fallos

Los assets internos se consultan directamente en la base y se comprueba que pertenecen al perfil solicitado. Las URLs externas solo admiten HTTPS sin credenciales/puerto, en hosts exactos de GitHub Avatars, Discord y Google (`lh3.googleusercontent.com`). No se siguen redirecciones. Se impone un tiempo máximo de 1500 ms, 512 KiB en el stream, MIME coincidente con la firma y dimensiones permitidas por el validador de imágenes existente. Otros recursos se sustituyen por iniciales. Si el decodificador no admite un archivo previamente validado, la generación se repite sin ese avatar.

Fallos de consulta/generación: 503 con `no-store` y `Retry-After: 30`. URL o usuario inválido/inexistente: 404 con caché breve. Las cifras no se reemplazan por ceros ante un error de base.

## Caché y coste

Datos e imagen usan `use cache` con stale 60 s, revalidate 120 s y expire 300 s. La respuesta usa `public, max-age=60, s-maxage=120, stale-while-revalidate=180`. Los datos equipados pueden tardar unos minutos en reflejar cambios; no se añade un timestamp a cada visita, que impediría reutilizar la imagen. Cada petición que llega al servidor utiliza el rate limiter PostgreSQL existente (60/min por clave de IP), además de las consultas acotadas necesarias en un miss de caché. Los hits de CDN no ejecutan ese código. El limiter conserva su política existente de continuidad ante indisponibilidad, por lo que no sustituye una protección de plataforma frente a ataques distribuidos.

Los likes aprovechan el índice `Reaction(targetType,targetId)`. La consulta no carga listas de seguidores, reacciones ni premios enteras. La proyección y el PNG se cachean por perfil/locale y datos públicos. No hay una caché independiente con crecimiento ilimitado en un Map global del proceso. No se puede prometer un precio de Vercel sin métricas de la cuenta; el laboratorio solo informa tiempos y bytes.

## Operación

Preview necesita su propia base de pruebas y las variables de autenticación apropiadas. No se copian credenciales de producción. Una compilación local aislada no confirma un despliegue en Vercel. La verificación final de CI/Preview se informa con el SHA exacto del PR; un 403 del conector no se interpreta como un error de compilación de la aplicación.
