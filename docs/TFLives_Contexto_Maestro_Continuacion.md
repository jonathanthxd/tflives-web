# TFLives Web — Contexto maestro para continuar el proyecto en otro chat

> **Propósito de este documento:** permitir que otro chat de ChatGPT continúe exactamente el mismo trabajo de desarrollo, dirección técnica, producto y UX que veníamos haciendo aquí, sin obligar a Jonathan a volver a explicar el proyecto desde cero.
>
> **Estado temporal del documento:** 15 de septiembre de 2026.
>
> **Importante:** este documento resume decisiones, arquitectura, entregas, migraciones, preferencias de trabajo, errores ya resueltos y tareas pendientes. Debe tratarse como **contexto operativo**, no como sustituto del código actual. En el nuevo chat, Jonathan debería adjuntar también el ZIP más reciente del proyecto antes de pedir cambios de código.

---

# 1. Identidad del proyecto

## Nombre

**TFLives Web**

Repositorio principal:

```text
https://github.com/jonathanthxd/tflives-web
```

Ruta local habitual de Jonathan:

```text
C:\Users\Administrator\Desktop\web-tflives
```

Branch de trabajo:

```text
main
```

Deployment:

```text
Vercel
```

Vercel está conectado a GitHub y despliega automáticamente `main`.

## Qué es TFLives

TFLives significa **Time For Lives**.

La web es el hub principal de una comunidad multigaming que incluye, entre otros proyectos:

- TFLives Comunidad.
- TFL Network.
- Streamers / ecosistema de creadores.
- Cosméticos y economía TFL.
- Wiki / contenido.
- Trayectoria.
- Futuras iniciativas como TFL Client, TFL Hosting, Nori, desarrollo, Roblox, etc.

TFL Network es una network de Minecraft, pero **TFLives no debe sentirse limitada a Minecraft**.

## Identidad visual

La identidad general buscada es:

- Premium.
- Moderna.
- Minimalista.
- Futurista sin convertirse en “dashboard genérico”.
- Dark-first, pero con Light completamente funcional.
- Azul / blanco / neutrales fríos como ADN inicial.
- Integración con color Accent personalizable desde Studio.
- Glassmorphism premium.
- Gradientes, partículas y backgrounds animados.
- Responsive real.
- Interfaces densas cuando corresponde, pero con jerarquía clara.

Evitar:

- UI que parezca una plantilla SaaS genérica.
- Windows Aero exagerado.
- Blur blanco lechoso demasiado evidente.
- Glass que destruya la legibilidad.
- Animaciones “baratas” tipo scale brusco.
- Reducir automáticamente efectos por hardware o por `prefers-reduced-motion`.

---

# 2. Stack técnico actual

## Frontend / framework

```text
Next.js 15.5.24
React 19
TypeScript
Tailwind
next-intl
Framer Motion / motion
```

La app utiliza App Router.

## Base de datos

```text
Neon PostgreSQL
Prisma
```

NO usa Supabase.

Una especificación antigua mencionaba Supabase, pero el proyecto fue migrado a:

```text
Neon + Prisma + Better Auth
```

No reintroducir Supabase.

## Auth

```text
Better Auth ~1.7.3
```

Métodos:

- Email/password.
- Google OAuth.
- Discord OAuth.

OAuth configurado con:

```text
https://www.tflives.com
http://localhost:3000
```

Callbacks:

```text
/api/auth/callback/google
/api/auth/callback/discord
```

URL canónica:

```text
BETTER_AUTH_URL=https://www.tflives.com
```

La vinculación de cuentas es deliberadamente segura. No hacer auto-merge por email de forma insegura.

## Emails

```text
Resend
```

## Otros datos públicos relevantes

Servidor Minecraft:

```text
mc.tflives.com:25565
```

Guild Discord:

```text
1246905708541120593
```

Tienda externa:

```text
https://shop.tflives.com
```

---

# 3. Reglas fundamentales de trabajo con Jonathan

Estas reglas son MUY importantes para continuar bien el proyecto.

## 3.1 Entregas

Jonathan prefiere que los cambios pequeños y medianos se entreguen como:

```text
.zip overlay
```

El ZIP debe extraerse directamente en:

```text
C:\Users\Administrator\Desktop\web-tflives
```

Los archivos deben estar dentro del ZIP con su estructura relativa correcta, sin carpeta contenedora innecesaria.

Ejemplo:

```text
src/...
messages/...
prisma/...
```

No:

```text
TFLivesPatch/
  src/...
```

Siempre indicar:

- Qué archivos modifica.
- Si hay archivos que borrar.
- Si hay migración.
- Si hay dependencias nuevas.
- Qué comandos ejecutar después.

## 3.2 Big updates

Jonathan suele pedir updates grandes agrupadas.

Evitar:

- Microparches constantes.
- Dividir innecesariamente una actualización que puede entregarse completa.
- Hacerle ejecutar veinte pequeñas modificaciones seguidas.

## 3.3 Código

Jonathan está aprendiendo y agradece explicación clara, pero no quiere lenguaje condescendiente.

Cuando haya que hacer cambios:

- Interpretar la intención de producto, no limitarse al texto literal.
- Mejorar decisiones malas si hay una opción técnicamente superior.
- Mantener UX/product thinking.
- Explicar brevemente por qué se eligió una arquitectura.

## 3.4 PowerShell

Jonathan trabaja en Windows.

Cuando sea útil, proporcionar comandos PowerShell exactos.

## 3.5 Máquina

Su PC es relativamente lento.

Evitar pedirle trabajo local pesado si no es necesario.

Vercel puede hacer el build final.

## 3.6 Git

Branch único:

```text
main
```

Flujo habitual:

```powershell
git add .
git commit -m "..."
git push origin main
```

## 3.7 Secretos

`.env` ha aparecido accidentalmente dentro de ZIPs anteriores.

Nunca:

- Exponer secretos.
- Copiar `.env` a entregas.
- Repetir passwords o tokens.
- Subir `.env`.

Existe `.env.example`, que sí puede modificarse si hace falta.

---

# 4. AGENTS.md del proyecto

Existe un `AGENTS.md` con una regla importante:

> “This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read relevant guide in node_modules/next/dist/docs/ before writing code.”

En muchos ZIPs enviados por Jonathan no existe `node_modules`.

Cuando no esté disponible:

- Seguir los patrones actuales del proyecto.
- Validar sintaxis.
- Evitar asumir APIs nuevas sin revisar el código existente.
- Si el nuevo chat dispone del repo con `node_modules`, leer las guías relevantes antes de tocar APIs sensibles de Next.

---

# 5. Flujo seguro de Prisma / migraciones

NO usar en producción:

```text
prisma db push
```

Flujo esperado:

```powershell
Get-Content .\prisma\migrations\<migration>\migration.sql
npx prisma migrate status
npx prisma migrate deploy
npm run db:generate
npx prisma migrate status
```

Después:

```powershell
npm run db:generate
npm run typecheck
npm test
npm run test:integration
npm run lint
npm run build
git diff --check
```

Si una release incluye DB, idealmente no recomendar commit/push hasta aplicar migración y validar.

---

# 6. Roadmap general

Roadmap histórico:

```yaml
v0.1: Foundation Migration
v0.2: Network & Content Core
v0.3: Community & Realtime
v0.4: Accounts, Security & Permissions
v0.5: Profiles & Identity
v0.6: Progression & Achievements
v0.7: TFL Economy
v0.8: Cosmetics & Premium
v0.9: Streamers & Creator Ecosystem
v0.10: Admin Platform
v0.11: Analytics & Observability
v0.12: UX, Accessibility & Responsive
v0.13: Performance & SEO
v0.14: Legal, Privacy & Safety
v0.15: Production Hardening
v0.16: Release Candidate
v1.0: Public Production
```

Estado conocido:

```text
v0.1  completado
v0.2  completado
v0.3  completado + pulido
v0.4  completado
v0.5  completado
v0.6  completado + expansión de logros
v0.7  completado
v0.8  completado + gran expansión posterior de cosméticos
v0.9  completado
v0.10 completado
v0.11 funcional + rework visual
v0.12 mayormente implementado; hubo correcciones posteriores
v0.13 completado (Performance & SEO)
v0.14 completado (Legal, Privacy & Safety)
v0.15 completado (Production Hardening)
v0.16 en curso (Release Candidate)
```

El número de versión en `package.json` ha seguido mostrando algo como:

```text
0.16.0
```

aunque funcionalmente el proyecto ha avanzado bastante más. No asumir que la semver del package representa el roadmap real.

---

# 7. Historial técnico importante

## v0.2

Network + content.

Migración:

```text
20260909010000_network_content_core
```

## v0.3

Comunidad + realtime:

- Chat global.
- DMs.
- Grupos.
- Amigos.
- Notificaciones.
- Moderación.

Migración:

```text
20260910000000_community_realtime
```

## v0.4

Accounts, seguridad, 2FA, settings.

Migración:

```text
20260911000000_accounts_security_permissions
```

## v0.5

Profiles & Identity.

Migración:

```text
20260912000000_profiles_identity
```

## v0.6

Progression & Achievements.

Migraciones:

```text
20260913000000_progression_achievements
20260914000000_obtainable_achievements
20260915000000_team_member_identity
```

## v0.7

Economía.

Migración:

```text
20260915000000_tfl_economy
```

## v0.8

Cosmetics & Premium.

Migración inicial:

```text
20260916000000_cosmetics_premium
```

Después el sistema fue ampliado muchísimo. Ver sección específica de Cosméticos.

## v0.9

Creators.

Migración:

```text
20260917000000_creator_ecosystem
```

## v0.10

Admin Platform.

Sin DB nueva relevante.

## v0.11

Analytics & Observability.

Migración:

```text
20260918000000_analytics_observability
```

Hubo un visual rework posterior.

## v0.12

UX, Accessibility & Responsive.

Codex implementó una parte importante, pero una ejecución se quedó sin cuota.

Después Vercel detectó:

```text
src/app/[locale]/(platform)/mensajes/page.tsx
Cannot find name 'data'
```

Se corrigieron los `const data = await res.json()` faltantes.

---

# 8. Landing principal `/`

Se trabajó bastante.

## Hero

La altura fue corregida para no ser excesiva.

La landing respeta el espacio real de navbar.

El indicador de scroll fue recolocado.

## CTA principal

Texto:

ES:

```text
Explorar Nuestros Proyectos
```

EN:

```text
Explore Our Projects
```

El CTA lleva a:

```text
/proyectos
```

No a `/network`.

## `/proyectos`

Existe un hub de proyectos.

Actualmente contiene al menos:

### TFL Network

Ruta:

```text
/network
```

### TFLives Comunidad

Ruta:

```text
/comunidad
```

La intención es que a futuro allí puedan aparecer:

- TFL Client.
- TFL Hosting.
- Nori.
- Development.
- Roblox.
- Otros proyectos.

La navbar no debe intentar representar todos los proyectos directamente.

---

# 9. Navbar actual

La navbar ha recibido varias iteraciones importantes.

## Arquitectura de enlaces

La estructura principal se dejó simétrica alrededor de la marca TFLives.

Aproximadamente:

```text
Studio | Idioma | Streamers | Proyectos | TFLives | Cosméticos | Trayectoria | Notificaciones | Mensajes | Perfil
```

Se retiraron enlaces redundantes como:

- Amigos.
- TFL Network directo.
- Comunidad directo.
- Tienda.
- Equipo.

Razones:

- `/proyectos` agrupa proyectos.
- Amigos ya existe dentro del menú de usuario.
- Wiki/Tienda viven mejor dentro de Network.
- Equipo puede vivir en footer / otras rutas secundarias.

## Morph de navbar

La navbar es una de las partes que más le gustan a Jonathan.

### Arriba del todo

Navbar:

- Rectangular.
- Bordes redondeados.
- Glassmorphism premium.
- Más ancha.
- Separación mayor.

### Al hacer scroll mínimo

Se convierte en:

- Pill.
- Más compacta.
- Extremos completamente circulares.
- Menor gap.
- Menor padding.
- Perfil reducido solo al avatar.
- Animación muy visible pero corta.

Umbral aproximado usado:

```text
> 12px compacta
< 3px expande
```

Se añadió histéresis para evitar jitter.

### Perfil

Expandida:

```text
avatar + nombre + flecha
```

Compacta:

```text
solo avatar
```

Pero abre el mismo menú:

- Perfil.
- Amigos.
- Suscripción.
- Admin, si corresponde.
- Configuración.
- Cerrar sesión.

## Corrección de deformación

Inicialmente Framer Motion hacía FLIP con scale y deformaba temporalmente texto.

Se cambió para animar geometría real:

- width.
- padding.
- gap.
- border-radius.
- letter-spacing.

Evitar volver a usar un `layout` que escale el contenedor entero y deforme glifos.

## Chat global

Hubo un bug donde el botón del Chat Global quedaba anclado a la navbar porque estaba dentro de un ancestro transformado.

Se corrigió sacando:

- Global Chat.
- Notification Toasts.

fuera del árbol transformado de la navbar.

No volver a renderizarlos dentro de un padre animado con `transform`.

## Studio panel y navbar

Cuando la navbar era expandida, el panel Studio quedaba demasiado cerca.

Se corrigió el offset para mantener una relación visual similar tanto con navbar expandida como compacta.

Mantener ese comportamiento.

---

# 10. TFL Glass — estándar visual global

Se creó un sistema de Glass compartido.

Clases / conceptos centrales:

```text
tfl-glass
tfl-glass-soft
tfl-glass-strong
tfl-glass-bar
tfl-glass-chip
```

Uso aproximado:

```text
Navbar                  → TFL Glass
Dropdowns               → Strong
Studio                  → Strong
Notificaciones          → Strong
Chat                    → Strong
Dialogs                 → Strong
Cards normales          → Soft
Headers/sidebar         → Bar
Controles pequeños      → Chip
```

Principios:

- Misma lógica de borde.
- Misma saturación.
- Mismo blur base.
- Misma profundidad.
- Accent de Studio.
- Light y Dark coherentes.

No convertir absolutamente todos los fondos semitransparentes en backdrop blur.

Evitar decenas de capas GPU innecesarias.

Los overlays detrás de modales pueden seguir usando `backdrop-blur`; eso no es “glass material”, sino desenfoque del escenario.

---

# 11. Studio — personalización visual

Studio sustituyó el viejo theme toggle.

Botón:

```text
Palette
```

Permite:

- Light / Dark.
- Accent.
- Backgrounds.
- Fonts.

Persistencia por localStorage.

## Colores actuales

Se ampliaron bastante.

Aproximadamente:

```text
Blue
Slate
Rose Intense
Pink
Fuchsia
Violet
Indigo
Sky
Cyan
Teal
Emerald
Green
Lime
Yellow
Amber
Orange
Red
```

## Fuentes

Entre las disponibles:

```text
TFL Original
Nunito
VT323
Outfit
Fredoka
Pixelify Sans
Chakra Petch
Quicksand
Rubik
```

## Ajuste de tamaño de fuentes

Para fuentes pequeñas como VT323 / Pixelify se utiliza:

```css
font-size-adjust
```

No escalar el root ni hacer zoom global.

Se evita alterar layouts de Tailwind.

Código técnico:

```text
code
pre
kbd
.font-mono
```

no debe sufrir ese ajuste.

---

# 12. Backgrounds de Studio

## Backgrounds exactos React Bits

Se implementaron versiones reales/locales a partir de código proporcionado.

Animados:

- Silk.
- Ghost Fibers.
- CRT Warp.
- Molten Metal.
- Gradient Waves.
- Prism.
- Line Waves.

Estáticos:

- Dot.
- Reactive Shading.
- Solid.

## Light theme

Los fondos animados están bloqueados en Light.

Si alguien cambia a Light teniendo uno animado:

- el sistema cae a Dot / static.
- existe defensa adicional en el renderer.

## Molten Metal

La interacción con mouse fue eliminada.

El fondo continúa animando, pero no reacciona al cursor.

## Previews

Hubo varias iteraciones.

La preview antigua falsa CSS fue eliminada.

Ahora el flujo deseado es:

```text
placeholder neutral / carga
→ renderer real
```

No mostrar una “aproximación vieja” del background antes de que WebGL cargue.

Se utiliza IntersectionObserver para preparar previews antes de que entren por completo en viewport.

---

# 13. Regla MUY IMPORTANTE: Reduced Motion

Jonathan NO quiere reducción automática de efectos.

Eliminar / no reintroducir:

```text
prefers-reduced-motion
useReducedMotion
reducedMotion
reduceMotion
motion-reduce:
motion-safe:
```

También evitar heurísticas que reduzcan visuales basadas en:

```text
deviceMemory
hardwareConcurrency
saveData
effectiveType
powerPreference: low-power
```

La intención explícita es:

> “Me gustaría que fuera pesado lo que tenga que ser.”

No degradar efectos visibles por hardware.

Sí se permiten optimizaciones invisibles que no cambian lo que el usuario ve, por ejemplo:

- Pausar renderers cuando el tab está oculto.
- No renderizar WebGL totalmente fuera de viewport.
- Lazy mount.
- Cache.
- Memoización.
- Preload.
- Pausa cuando la app no está visible.

Pero cuando algo **está visible**, todos deberían ver el mismo efecto.

---

# 14. Content Focus / legibilidad sobre fondos animados

Problema detectado:

CRT Warp, Prism y otros fondos eran demasiado protagonistas y dificultaban leer contenido.

No se quiso resolver matando los backgrounds con un overlay gris plano.

Se creó una capa intermedia:

```text
UI / Glass / texto
       ↑
TFL Content Focus
       ↑
Studio background
```

Archivo creado aproximadamente:

```text
src/shared/ui/effects/content-readability-layer.tsx
```

## Comportamiento

En landing `/`:

```text
NO se aplica Content Focus
```

La landing muestra el background en su máximo esplendor.

En rutas de contenido:

```text
/proyectos
/network
/comunidad
/cosmeticos
/trayectoria
/perfil/*
/configuracion
/admin
...
```

sí se aplica.

## Intensidades

Ejemplo conceptual:

Balanced:

- Silk.
- Ghost Fibers.
- Line Waves.

Strong:

- Molten Metal.
- Gradient Waves.

Intense:

- CRT Warp.
- Prism.

Static:

- Dot.
- Reactive Shading.
- Solid.

El layer:

- Baja luminosidad extrema.
- Reduce saturación.
- Suaviza contraste.
- Aplica blur muy pequeño.
- Crea una zona central más calmada.
- Mantiene color Accent y ambiente en laterales.

No modificar shaders originales para resolver legibilidad.

---

# 15. Editor de imágenes de perfil

Se añadió edición previa antes de publicar:

- Avatar.
- Banner.

Componente aproximado:

```text
src/modules/profiles/components/profile-image-editor.tsx
```

## Avatar

Crop:

```text
1:1
```

Guía circular.

Output objetivo:

```text
1024 × 1024
WebP
```

## Banner

Crop:

```text
3:1
```

Output:

```text
1920 × 640
WebP
```

Permite:

- Arrastrar.
- Zoom.
- Previsualizar.
- Optimizar antes de upload.

Se intenta mantener debajo del límite actual de 2 MB.

Debe ser reutilizable para futuras imágenes:

- Posts.
- CMS.
- Creators.
- Etc.

---

# 16. Admin

Se reorganizó una inconsistencia:

Antes los stickers oficiales estaban dentro de:

```text
/admin/reports
```

Eso se consideró raro.

Ahora existe:

```text
/admin/chat
```

Conceptualmente:

```text
Admin
└── Comunidad
    ├── Usuarios
    ├── Reportes
    ├── Chat y stickers
    ├── Moderación
    ├── Creadores
    └── Equipo
```

El API de stickers también pasó conceptualmente de permiso `reports` a `chat`.

Se conservó acceso MOD / ADMIN para no cambiar silenciosamente permisos.

---

# 17. Sistema de logros

El sistema se amplió mucho.

## Catálogo

Se añadieron:

```text
200 logros nuevos
```

Total aproximado del sistema oficial:

```text
211 logros
```

Distribución de los 200 nuevos:

```text
50 Comunidad
70 Social
70 Progreso
10 Identidad
```

## Requisitos

Los nuevos logros dependen de datos reales del servidor:

- GlobalChatMessage.
- DirectMessage.
- Friendship.
- UserProgress.
- Account.
- User.

No confiar en eventos enviados por cliente.

## XP

Los 200 nuevos no dan XP.

Razón:

Evitar loop:

```text
logro
→ XP
→ nivel
→ nuevo logro
→ XP
→ ...
```

Sí pueden dar TFL Coins.

## Reconciliación / usuarios antiguos

Existe una necesidad actual IMPORTANTE:

Jonathan tiene Discord y Google vinculados desde antes de la actualización y no recibió el logro correspondiente.

Desea que **todos los logros sean receptivos / reconciliables**.

Es decir, al cargar su perfil/logros, login, o en un evento apropiado, el servidor debería revisar:

```text
¿Cumple actualmente el usuario esta condición?
```

Si sí:

```text
y no tiene el logro
→ otorgarlo retroactivamente
```

No depender únicamente de que la acción ocurra después del deploy.

Esto debe aplicarse no solo a OAuth, sino idealmente a todos los logros cuyo estado pueda reconstruirse a partir de DB.

Debe hacerse con cuidado para no generar spam ni queries absurdamente caras.

Una posible arquitectura deseada:

- Reconciliación ligera por categoría.
- Checkpoints.
- Cache / timestamps de última reconciliación.
- Batch.
- Solo notificar el logro más significativo de una cascada, no 40 toasts.

Esto es una de las tareas PENDIENTES del próximo chat.

---

# 18. Economía TFL

Existe sistema de:

```text
TFL Coins
WalletTransaction
```

Compras de cosméticos:

```text
Cosmetic
→ comprar
→ wallet transaction
→ UserCosmetic
→ inventario
→ equipar
```

Las compras de cosméticos YA NO deben crear una notificación persistente por cada compra.

Comportamiento deseado:

```text
Compra
→ popup temporal en /cosmeticos
→ desaparece
→ queda registrada en Transacciones
```

La transacción debe mostrar el nombre localizado del cosmético.

Ejemplo ES:

```text
Cosmético: Oro Real
```

EN:

```text
Cosmetic: Royal Gold
```

---

# 19. Cosméticos — estado actual

Esta sección es MUY importante porque actualmente es uno de los focos centrales.

## Catálogo oficial

Se hizo una gran expansión a:

```text
80 cosméticos oficiales
```

Distribución:

```text
16 Avatar Frames
16 Profile Accents
16 Profile Badges
16 Nameplates
16 Banner Styles
```

Rarezas:

```text
20 Common
20 Rare
20 Epic
20 Legendary
```

Aproximadamente 10 son Premium.

El catálogo fue finalizado y se preparó una migración que:

- Reconciliaba cosméticos antiguos.
- Corregía nombres.
- Migraba ownership cuando había equivalencias.
- Eliminaba pruebas/random sin equivalencia.
- Dejaba solo catálogo oficial.

Migraciones recientes:

```text
20260919000000_cosmetics_visual_system
20260919001000_production_cosmetics_catalog
20260919002000_cosmetics_catalog_finalization
20260919003000_cosmetic_store_experience
```

## Importante sobre estado real

En el nuevo chat, antes de asumir que estas migraciones están aplicadas, preguntar o revisar:

```powershell
npx prisma migrate status
```

No afirmar que están desplegadas si Jonathan no lo confirma.

---

# 20. Cosmetic Renderer

Se creó un renderer central.

Objetivo:

```text
lo que compras
=
lo que previsualizas
=
lo que se muestra en perfil
```

Archivo aproximado:

```text
src/modules/cosmetics/components/cosmetic-renderer.tsx
```

No duplicar visuales por pantalla.

La preview del catálogo debe usar el mismo sistema.

---

# 21. Profile Accent

Inicialmente era demasiado básico.

Se evolucionó para afectar:

- Ambiente detrás del perfil.
- Header.
- Bordes.
- Sombras.
- Cards internas.
- Patrones.
- Iluminación.

Debe sentirse como un “tema del perfil”, no como un border-color.

Ejemplos:

- Cyber.
- Royal.
- Cosmic.
- Crimson.
- Frost.
- Obsidian.

---

# 22. Banner Styles

Se corrigió un problema conceptual.

Antes el estilo podía quedar oculto si había una imagen de banner.

Ahora el banner style debe ser una capa encima del banner real.

Ejemplos:

- CRT.
- Aurora.
- Nebula.
- Grid.
- Liquid.
- Prismatic.
- Starfield.
- Cyber.
- Molten.
- Frost.
- Sakura.
- Void.
- Royal.
- Ocean.
- Glass.
- Sunset.

Debe seguir viéndose la imagen original.

---

# 23. Nameplates

Se elevó bastante el sistema.

Los 16 actuales aproximadamente incluyen:

- Violet.
- Neon Cyan.
- Rose.
- Emerald.
- Frost.
- Inferno.
- Matrix.
- Pixel.
- Molten.
- Aurora.
- Chrome.
- Sunset.
- Royal.
- Void.
- Holographic.
- Galaxy.

## Micro-effects

Se añadió una capa interna:

```text
cosmetic-nameplate__microfx
```

Ejemplos:

### Matrix

Letras / dígitos cayendo dentro del nameplate.

No cubrir el texto principal.

### Inferno

Brasas.

### Frost

Líneas cristalinas.

### Galaxy

Campo estelar.

### Holographic

Barrido iridiscente.

### Chrome

Reflejo metálico.

### Pixel

Movimiento escalonado/pixelado.

### Molten

Burbujas fundidas.

Principio general:

> Un cosmético debe sentirse especial por algo más que un recolor.

---

# 24. Catálogo de cosméticos / UX

Se eliminó el sistema anterior de filtros superiores:

```text
Todos
Frames
Accents
Badges
Nameplates
Banners
```

Se sustituyó por colecciones horizontales.

Conceptualmente:

```text
┌─────────────────────────────┐
│ Marcos de avatar      ← →   │
│ [1] [2] [3] [4] [5] →      │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Acentos de perfil     ← →   │
│ [1] [2] [3] [4] [5] →      │
└─────────────────────────────┘
```

Características:

- Horizontal scrolling.
- Flechas.
- Touch.
- Trackpad.
- Peeking en móvil.
- “Volver” donde antes estaban filtros.

No rehacer la UI de cards sin necesidad; Jonathan dijo que la forma de manejarlos/configurarlos le gusta.

---

# 25. Bug avatar frame + banner — ya corregido

Hubo un bug donde avatar + frame se cortaban a la mitad con el banner.

Causa:

- Avatar superpuesto con margen negativo.
- Overlay del banner con stacking layer superior.

Se corrigió dando una capa superior explícita al bloque de identidad.

Aun así, verificar que futuras modificaciones de avatar frames no vuelvan a introducir:

```text
overflow: hidden
z-index incorrecto
stacking context inesperado
```

---

# 26. TAREA PENDIENTE MUY IMPORTANTE: Avatar Frames 2.0

Esta es la tarea más reciente que Jonathan pidió y todavía NO se terminó en este chat.

## Problema actual

Aunque hay muchos avatar frames y se ven buenos, Jonathan nota que casi todos siguen siendo:

```text
un aro circular
+
recolor
+
glow
```

y desea mucha más personalidad.

El círculo base debe mantenerse porque:

```text
la foto de perfil es circular
```

pero el frame no debería limitarse a un simple borde circular.

## Objetivo

Diseñar avatar frames con:

- Silueta circular base.
- Elementos externos.
- Asimetrías controladas.
- Ornamentos.
- Fragmentos.
- Runas.
- Picos.
- Arcos rotos.
- Partículas.
- Capas.
- Órbitas.
- Segmentos independientes.
- Geometría distinta por preset.
- Microanimaciones únicas.
- Detalles temáticos reconocibles.

### Ejemplos conceptuales

No literal, pero la idea:

#### Inferno

No solo amarillo/naranja.

Podría tener:

- Llamas estilizadas que sobresalen.
- Dos cuernos/crestas pequeñas.
- Brasas orbitando.
- Segmentos calientes que “respiran”.
- Arco incompleto para que parezca material vivo.

#### Sakura

No solo rosa.

- Pétalos que nacen en puntos específicos.
- Rama curva parcial.
- 2–3 pétalos externos.
- Glow muy suave.

#### Royal Gold

- Corona geométrica arriba.
- Pequeñas “gemas”.
- Segmentos dorados gruesos.
- Ornamento inferior.

#### Galaxy

- Planeta/órbita.
- Estrella principal.
- Arco externo incompleto.
- Partículas estelares.
- Capas con distinta velocidad.

#### Toxic

- Biohazard-ish sin usar logo exacto si no hace falta.
- Gotas / cápsulas.
- Segmented ring.
- Pulsos verdes.

#### Cyber Grid

- Circuitos que salen del aro.
- Nodos.
- Esquinas angulares.
- Pequeño HUD.

#### Frost

- Cristales externos.
- Tres picos de hielo.
- Crack pattern.
- Sparkles.

#### Prism

- Facetas.
- Fragmentos que reflejen.
- Rotación de hue.
- Arco externo irregular.

## Restricciones

- NO cambiar el sistema de compra.
- NO rehacer la página de cosméticos.
- NO romper avatars.
- NO romper mobile.
- NO permitir que ornaments se corten.
- Mantener forma usable con avatar circular.
- Usar el renderer existente.
- Preview = output real.
- Animaciones visibles deben ser iguales para todos.
- Nada de reduced motion.

Esta debe ser tratada como una **big visual-content update de Avatar Frames**, no como recolores.

---

# 27. TAREA PENDIENTE: Reconciliación automática de logros

Como se explicó antes:

Jonathan tiene cuentas Google + Discord vinculadas desde antes de que existiera el logro.

Debe recibirlo automáticamente.

Aplicar a todos los logros reconstruibles.

Idealmente implementar:

```text
reconcileAchievements(userId)
```

o equivalente, pero evitando hacerlo de forma bruta en cada request.

Requisitos:

- Idempotente.
- Server-side.
- Basado en DB real.
- No confiar en cliente.
- Evitar spam de notificaciones.
- Evitar XP loops.
- Poder otorgar históricos.
- Compatible con los 211 logros.
- No duplicar rewards.
- No duplicar UserAchievement.
- Manejar concurrencia.

Posibles triggers:

- Login.
- Abrir perfil.
- Abrir achievements.
- Evento relevante.
- Job periódico.
- Checkpoints.

Elegir arquitectura inteligente.

---

# 28. TAREA PENDIENTE: eliminar Reduced Motion completamente

Jonathan reiteró esta petición al final.

Hay que auditar TODO el proyecto y eliminar cualquier reducción visible basada en:

```text
prefers-reduced-motion
useReducedMotion
reducedMotion
reduceMotion
motion-reduce
motion-safe
deviceMemory
hardwareConcurrency
saveData
effectiveType
low-power
```

Búsqueda recomendada:

```powershell
Get-ChildItem -Recurse -File |
Select-String -Pattern "prefers-reduced-motion|useReducedMotion|reducedMotion|reduceMotion|motion-reduce|motion-safe|deviceMemory|hardwareConcurrency|saveData|effectiveType|low-power" |
Select-Object Path, LineNumber, Line
```

O con ripgrep:

```powershell
rg -n -i "prefers-reduced-motion|useReducedMotion|reduced.?motion|motion-reduce|motion-safe|deviceMemory|hardwareConcurrency|saveData|effectiveType|low-power" .
```

Cuidado:

No eliminar optimizaciones que solo pausarán cosas invisibles/offscreen.

La regla es:

```text
Visible → máxima experiencia para todos
Invisible → se puede optimizar
```

---

# 29. Último error de build ya corregido

Vercel falló con:

```text
src/modules/cosmetics/service.ts:374:11
Cannot find name 'createNotification'
```

Causa:

Al quitar notificaciones de compra se quitó el import, pero Premium todavía usaba `createNotification`.

Fix:

Restaurar:

```ts
import { createNotification } from "@/modules/notifications/service";
```

sin reactivar notificaciones de compra.

Compras:

```text
NO persistent notification
```

Premium grant/revoke:

```text
SÍ puede notificar
```

No volver a borrar ese import a menos que también se reestructure Premium.

---

# 30. Notificaciones

El dropdown de notificaciones fue mejorado:

- Avatar real.
- Iconos del sistema.
- Unread dot.
- Header.
- Marcar todo leído.
- Timestamps.
- Empty state.
- Mejor spacing.
- Responsive.

No volver a meter Notificaciones + Mensajes en una caja común.

Jonathan lo rechazó.

Deben estar libres:

```text
🔔   💬   perfil
```

del mismo modo que:

```text
Studio   Idioma
```

---

# 31. Chat Global

El botón flotante debe permanecer anclado al viewport.

No meterlo dentro de elementos con:

```text
transform
filter
perspective
will-change: transform
```

si eso altera `position: fixed`.

Puede ser draggable.

Debe mantenerse abajo de la pantalla, no dentro de la navbar.

---

# 32. Responsive

Se ha trabajado con especial atención a:

```text
390px
1366px
1920px
```

La navbar debe:

- Evitar aplastar labels.
- Cambiar a mobile menu cuando no quepa.
- Mantener tamaño visual principal.
- Compactar spacing, no convertir todo en miniatura.

En mobile, abrir menú puede expandir temporalmente la navbar rectangular y volver a pill al cerrarse si sigue scrolleado.

---

# 33. Páginas / rutas importantes

Algunas rutas:

```text
/
 /proyectos
 /network
 /comunidad
 /cosmeticos
 /streamers
 /equipo
 /trayectoria
 /perfil/[usuario]
 /configuracion
 /mensajes
 /admin
 /admin/chat
 /admin/reports
 /legal
```

Con locale:

```text
/es/...
/en/...
```

No hardcodear `/es` internamente si el proyecto ya maneja locale con next-intl.

---

# 34. Traducciones

La web es ES/EN.

Archivos:

```text
messages/es.json
messages/en.json
```

Todo contenido oficial nuevo debe considerar ambos idiomas:

- Cosméticos.
- Logros.
- UI.
- Admin.
- Estados.
- Tooltips.
- Empty states.

No dejar Spanglish accidental salvo términos donde sea intencional:

- CRT.
- Pixel.
- Sakura.
- Studio.
- etc.

---

# 35. Calidad visual — principios ya aprendidos

Estas preferencias de Jonathan deben mantenerse.

## Sí

- Microefectos.
- Profundidad.
- Transiciones fluidas.
- Hover bien trabajado.
- Capas.
- Partículas pequeñas.
- Ambientes.
- Geometría propia.
- Componentes con identidad.
- Animaciones “jugables” que se sienten agradables al interactuar.

## No

- Solo recolors.
- UI plana sin personalidad.
- Cards genéricas.
- Scale exagerado.
- Blur blanco tipo Aero.
- Efectos sacrificados por “performance mode”.
- Reducir cosas por hardware.
- Visuales falsos en previews que cambian al cargar.

---

# 36. Cómo continuar en el nuevo chat

Recomendación para Jonathan:

1. Adjuntar este `.md`.
2. Adjuntar el ZIP actual del proyecto.
3. Decir algo como:

```text
Este .md contiene todo el contexto del chat anterior.
Quiero que continúes exactamente desde aquí.

La siguiente update pendiente (v1.1 backlog) es:
1. Avatar Frames 2.0 con geometrías mucho más complejas y únicas.
2. Reconciliación automática de logros históricos.
3. Eliminar reduced motion / low resource visual degradation en todo el proyecto (auditado: src/ ya limpio).

Trabaja directamente sobre el ZIP que adjunto y entrégame un overlay ZIP.
```

El nuevo chat debe leer primero este documento y luego auditar el código actual.

NO debe basarse en un ZIP antiguo mencionado aquí si Jonathan adjunta uno más nuevo.

---

# 37. Orden recomendado para la próxima update

Yo continuaría así:

## Parte A — Audit

Antes de modificar:

- Revisar renderer de cosmetics.
- Revisar presets de los 16 avatar frames.
- Revisar CSS de frames.
- Revisar stacking / overflow.
- Revisar achievements catalog/service.
- Revisar triggers actuales.
- Buscar TODO reduced-motion / low-resource.

## Parte B — Avatar Frames 2.0

Rehacer los 16 frames con:

- Una identidad geométrica distinta.
- 2–4 capas cuando tenga sentido.
- Ornamentos.
- Microanimaciones.
- Edge details.
- No solo color.

Mantener slugs/presets/ownership.

No crear una migración si solo cambia renderer/CSS.

## Parte C — Achievements reconciliation

Diseñar una función central idempotente.

Añadir tests:

- OAuth vinculado antes de update.
- Friendship existente.
- Mensajes existentes.
- Nivel ya alcanzado.
- No duplicar reward.
- No duplicar row.
- Concurrent reconcile.
- Multi-achievement chain.
- Notification dedupe.

## Parte D — Motion audit

Eliminar reducciones visuales.

Asegurarse de que:

- Studio.
- Navbar.
- Cosmetic renderers.
- Cards.
- Backgrounds.
- Nameplates.
- Avatar frames.
- Landing.
- Modals.
- Admin.

no cambien por `prefers-reduced-motion`.

## Parte E — QA

```powershell
npm run db:generate
npm run typecheck
npm test
npm run test:integration
npm run lint
npm run build
git diff --check
```

Si hay migración:

```powershell
npx prisma migrate status
npx prisma migrate deploy
```

antes del build final.

---

# 38. Archivos que probablemente serán relevantes en la próxima update

Dependiendo del estado exacto del ZIP:

```text
src/modules/cosmetics/visuals.ts
src/modules/cosmetics/components/cosmetic-renderer.tsx
src/modules/cosmetics/components/cosmetics-catalog.tsx
src/modules/profiles/components/profile-view.tsx
src/styles/globals.css

src/modules/progression/catalog.ts
src/modules/progression/service.ts
src/app/api/achievements/user/route.ts
src/modules/achievements/components/achievements-card.tsx
tests/unit/progression.test.ts

src/shared/ui/studio/*
src/shared/ui/studio/backgrounds/*
src/shared/ui/layout/navbar.tsx
```

También buscar globalmente reduced-motion.

---

# 39. Migraciones conocidas hasta este punto

Lista consolidada relevante:

```text
20260909010000_network_content_core
20260910000000_community_realtime
20260911000000_accounts_security_permissions
20260912000000_profiles_identity
20260913000000_progression_achievements
20260914000000_obtainable_achievements
20260915000000_team_member_identity
20260915000000_tfl_economy
20260916000000_cosmetics_premium
20260917000000_creator_ecosystem
20260918000000_analytics_observability

20260919000000_cosmetics_visual_system
20260919001000_production_cosmetics_catalog
20260919002000_cosmetics_catalog_finalization
20260919003000_cosmetic_store_experience
```

Verificar en el proyecto real porque puede haber otras migraciones no listadas.

---

# 40. Entregas ZIP recientes relevantes

Nombres históricos usados:

```text
TFLives_home_landing_pass_1.zip
TFLives_Studio_exact_reactbits_v2.zip
TFLives_Studio_v3_previews_lightlock_fonts.zip
TFLives_navbar_projects_notifications_v1.zip
TFLives_navbar_morph_glass_v2.zip
TFLives_navbar_glass_standard_v3.zip
TFLives_content_focus_readability_v1.zip
TFLives_media_editor_studio_preview_v1.zip
TFLives_200_production_achievements.zip
TFLives_small_polish_studio_admin_chat.zip
TFLives_cosmetics_big_big_production_update.zip
TFLives_cosmetics_final_production_catalog.zip
TFLives_cosmetics_store_experience_v2.zip
TFLives_cosmetics_buildfix_createNotification.zip
```

IMPORTANTE:

Estos nombres son históricos.

No aplicar uno encima de otro en el nuevo chat salvo que Jonathan lo pida.

Siempre trabajar sobre el **ZIP actual del proyecto** que él adjunte.

---

# 41. Filosofía del proyecto a conservar

TFLives está dejando de ser una web funcional “correcta” y está entrando a una etapa donde importa muchísimo:

```text
sensación
identidad
personalidad
coherencia
microinteracción
calidad percibida
```

Por eso Jonathan valora especialmente mejoras como:

- Navbar que físicamente “morphea”.
- Backgrounds exactos.
- Glass unificado.
- Content Focus.
- Nameplates con efectos propios.
- Cosméticos con identidad real.
- Editors de avatar/banner tipo Discord.
- Catálogo horizontal.
- Studio completo.

Cuando algo funciona pero se siente genérico, hay que preguntarse:

> “¿Cómo hacemos que se sienta TFLives?”

No solo:

> “¿Cómo hacemos que funcione?”

---

# 42. Preferencias de respuesta

Jonathan suele responder con mensajes directos y quiere avances concretos.

Ideal:

- Explicar qué se hizo.
- Enlace al ZIP.
- Instrucciones claras.
- Resumen de arquitectura.
- Comandos de validación.
- Qué probar visualmente.

Evitar:

- Grandes disclaimers innecesarios.
- Preguntar cosas que ya están claras.
- Repetir requisitos que Jonathan ya dio.
- Pedir confirmación antes de implementar algo obvio.
- Prometer “luego lo hago”; si la tarea es clara, hacerla.

---

# 43. Resumen ultra corto para un nuevo modelo

Si solo lees una sección, lee esta:

```text
Proyecto: TFLives Web
Repo: github.com/jonathanthxd/tflives-web
Stack: Next 15.5.24 + React 19 + TS + Tailwind + Prisma + Neon + Better Auth + next-intl
Branch: main
Deploy: Vercel
Idiomas: ES/EN
No Supabase
No prisma db push
No secrets/.env
Entregas: ZIP overlay a raíz
```

Visual:

```text
Premium dark/light
Studio con accents/fonts/backgrounds React Bits
Navbar morph rectangular → pill al hacer scroll
TFL Glass global
Content Focus para legibilidad
Nada de reduced motion o low-resource visual degradation
```

Cosméticos:

```text
80 oficiales
16 por tipo
Avatar Frames
Profile Accents
Badges
Nameplates
Banner Styles

Renderer central
Compra con TFL Coins
Sin notificación persistente de compra
Transacción sí muestra nombre del cosmético
```

Logros:

```text
211 aprox.
200 nuevos
deben reconciliarse retroactivamente
```

PRÓXIMA UPDATE:

```text
1. Avatar Frames 2.0:
   geometrías circulares mucho más complejas y únicas,
   no recolors.

2. Logros:
   reconciliación automática de condiciones históricas.

3. Motion:
   eliminar completamente reduced motion / low-resource degradation.
```

Eso es lo siguiente.

---

# 44. Última instrucción al nuevo chat

Antes de escribir código:

1. Leer este documento.
2. Leer `AGENTS.md`.
3. Inspeccionar el ZIP actual adjunto por Jonathan.
4. No asumir que archivos históricos aquí mencionados siguen iguales.
5. Hacer cambios directamente sobre el estado actual.
6. Entregar overlay ZIP.
7. No incluir `.env`.
8. No introducir reduced motion.
9. Mantener ES/EN.
10. Mantener compatibilidad con producción.

---

**Fin del contexto maestro.**
