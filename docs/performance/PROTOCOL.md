# Repetir la validación de rendimiento y aspecto

## Entorno y comandos

Usar Node 24, el lockfile y Chromium de Playwright. Desde un checkout limpio:

```sh
npm ci
npm run db:generate
npm run lint
npm run typecheck
npm test
npm run build:lab
npm run test:e2e
npm run test:integration
npm exec -- playwright install --with-deps chromium
npm run test:visual
```

`build:lab` ejecuta el **mismo `npm run build` de producción** con PostgreSQL efímero (PGlite) y todas las migraciones existentes. Es necesario porque el prerender consulta el catálogo. No conecta a Neon, no ejecuta `db push` y no modifica migraciones. CI genera Prisma una vez y pide al envoltorio que ejecute directamente `next build` mediante `TFL_PRISMA_READY=1`. Las pruebas HTTP y de navegador levantan su propio servidor y base efímera.

Puertos reservados: compilación 55446; navegador 55447/3117; caché opcional de fuentes 3116; HTTP smoke 55438/3108; integración 55439/3109. Ejecutar las tareas pesadas y las suites de navegador de forma secuencial.

Los secretos de prueba son constantes locales sin acceso a servicios reales. OAuth, correo y Discord externos se desactivan exclusivamente en el proceso de prueba. La inscripción, sesión, permisos, lectura de perfil y demás APIs del servidor siguen siendo las implementaciones reales. Las cuentas y cosméticos reproducibles se crean únicamente en PGlite y desaparecen al terminar.

Cada contexto de navegador usa una dirección reservada de documentación (`192.0.2.x`) como visitante local independiente. Así, 72 contextos sintéticos no agotan juntos la cuota real de autenticación de una sola IP loopback. No se desactiva ni modifica el rate limiter de la aplicación.

## Fuentes en un entorno con problemas de descarga

La compilación habitual debe descargar las fuentes mediante `next/font`. Si el transporte del entorno falla, existe una alternativa explícita:

```sh
npm run perf:cache-fonts
npm run build:lab:cached
```

El primer comando descarga el CSS real de Google y sus WOFF2 reales, verifica la firma `wOF2` y guarda archivos con SHA-256 e inventario. El segundo sirve esos mismos bytes por HTTP local durante `next build`, usando el mecanismo de respuestas de Google de Next (`NEXT_FONT_GOOGLE_MOCKED_RESPONSES`). El nombre del mecanismo contiene «mocked»; **el contenido de las fuentes no es sintético**. No sustituye la aplicación, APIs o autenticación por mocks. No incorpora la caché al repositorio ni cambia el despliegue. `TFL_FONT_CACHE_DIR` permite compartir exactamente el mismo inventario en ambos builds.

## Matriz automática

`test:visual` guarda resultados bajo `performance-artifacts/current/`, ignorado por Git. `TFL_PERF_OUTPUT` cambia el destino. CI conserva el directorio como artefacto durante 14 días.

- Nueve rutas: inicio, Network, Wiki, login, registro, perfil reproducible, mensajes, configuración y administración.
- Español/inglés × claro/oscuro × 1440×900/390×844: **72 estados** con capturas completas, HTTP 200, contenido principal, locale y errores del navegador/servidor.
- Cuenta real local para rutas privadas; administrador real local para administración. Perfil equipado con frame, acento, nameplate, badge y banner existentes.
- Navegación posterior mediante enlace visible de inicio a Network en los ocho entornos.
- Nueve fuentes elegidas en Studio y persistidas tras recarga en los ocho entornos; comprobación del `FontFace` real cargado, no sólo del nombre CSS.
- Diecisiete acentos elegidos en Studio y comprobados en localStorage en los ocho entornos; recarga con el último elegido y capturas de rose/emerald/violet.
- Tres fondos estáticos y siete animados en ambos tamaños, en oscuro. Los efectos se comprueban por llamadas de dibujo WebGL y valores de uniformes temporales cambiantes, además de la captura.
- Dieciocho primeras visitas con cada fuente previamente guardada, en ambos tamaños. Sus transferencias y CLS se guardan aparte para detectar el coste de cargar una fuente opcional al hidratar.

`TFL_VISUAL_EXTENDED=0` sólo permite diagnóstico rápido de las 72 rutas; **no sustituye la validación completa de la versión**. CI ejecuta el modo completo.

Para separar la comparación de primeras visitas de la actividad gráfica de las pruebas interactivas, se puede ejecutar primero la matriz de rutas (`TFL_VISUAL_EXTENDED=0`) y después toda la personalización con `TFL_STUDIO_ONLY=1` en otro destino. El segundo modo conserva los ocho entornos de Studio y las pruebas de login/configuración en español oscuro, las 18 fuentes guardadas y el flujo adicional de mensajes. `TFL_FONT_VISITS_ONLY=1` permite recoger sólo esas 18 visitas de fuentes en la referencia original. Estos modos enfocados no sustituyen las otras pruebas; la validación local combina ambas fases y CI ejecuta todas juntas por defecto.

`TFL_DM_ONLY=1` permite repetir únicamente el flujo adicional de conversación real: apertura por query, selección repetida de la conversación activa y selector de emojis. Requiere el modo extendido. Sirve para investigar un fallo puntual; tampoco sustituye la matriz completa.

`TFL_ROUTE_FILTER=/login` limita la matriz a una ruta y registra el filtro en `run.json`; `/` selecciona sólo inicio. Usarlo sólo para diagnósticos enfocados; quitarlo antes de recoger las 72 observaciones de la comparación principal.

## Qué significan las cifras

Se mide una compilación de producción servida localmente, sin limitar CPU/red; Chromium usa composición por software (`--disable-gpu`) y WebGL SwiftShader. Las opciones exactas constan en `run.json` y en la matriz. El tamaño móvil es un viewport, no un teléfono físico. La base es pequeña y reproducible, no una copia de producción. Las cuentas locales no prueban OAuth, entrega de correo o conectividad con Discord reales.

`measurements.json` registra Node, Next, Chromium, build ID, ruta, idioma, tema y viewport. Incluye FCP, LCP observado antes de interacción, CLS máximo por ventana de sesión, TTFB, instantes observados de `main` y de su primer título, recursos JS/CSS/fuentes/imágenes y precargas en HTML/cabeceras. Tras cargar las fuentes, espera al menos 2,5 segundos y un segundo sin finalizar nuevos recursos estáticos/API, con todas esas peticiones completas (máximo 15 segundos). Excluye únicamente las peticiones RSC de prefetch que Next puede mantener pendientes; incluye los recursos que esas precargas ya descargaron. Así evita presentar transferencias aún incompletas como una reducción de peso.

`mainVisibleObservedMs` y `headingVisibleObservedMs` son observaciones de la automatización; no prueban que toda la información diferida esté lista. `initialSettledObservedMs` registra el final de esa espera. La suma `blocking` es duración de tareas largas menos 50 ms hasta la muestra: **no es INP ni el TBT de Lighthouse**.

Los tamaños `encodedBodySize` son bytes recibidos en el laboratorio; no son tamaños gzip/Brotli garantizados de Vercel. `warm-navigation.json` mide aparte las ocho navegaciones cliente de inicio a Network: tiempo observado hasta su título y bytes adicionales tras completar recursos. Verifica que se conserva el documento (sin recarga). Ese tiempo no representa toda la información diferida ni INP. Los números principales corresponden a primeras visitas con contexto nuevo. No se atribuye una mejora estadística de latencia a una observación por estado. Para eso se necesitan varias ejecuciones en una máquina quieta y RUM con consentimiento y presupuesto definidos.

Comparar dos matrices con la misma versión de Node, Next, Chromium, base, fuentes y parámetros:

```sh
node scripts/performance/compare.mjs before/measurements.json after/measurements.json comparison.json
```

## Revisión humana antes de publicar

Comparar las capturas anteriores y posteriores de cada ruta/idioma/tema/tamaño, sobre todo inicio, perfil equipado, mensajes, configuración y admin. Revisar jerarquía, espaciado, medidas de texto, acentos, glass, legibilidad y navegación móvil. En tipografías revisar también áéíóú/ñ, títulos, tamaños corregidos de VT323 y Pixelify, y persistencia de preferencias.

Revisar el frame del avatar, banner, nameplate y badge del perfil reproducible. Comprobar los formatos y la apariencia de iconos frente al original reducido a la misma dimensión. Una diferencia de píxeles en un shader, reloj o efecto activo no equivale automáticamente a regresión. Abrir los fondos animados, interactuar y observar continuidad; las comprobaciones WebGL no sustituyen una revisión de arte.

Protocolo adicional para v0.18: teléfono físico, dispositivos con GPU limitada, visitas repetidas con caché caliente, datos representativos mayores, compositor de imágenes/avatar y todos los presets cosméticos premium. No cambiar automáticamente movimiento por heurísticas de hardware o preferencias del SO: la identidad aprobada debe conservarse.
