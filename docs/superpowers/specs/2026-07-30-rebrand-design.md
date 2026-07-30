# TFLives — Rediseño visual desde cero

**Fecha**: 2026-07-30
**Estado**: Aprobado por Jonathan, pendiente de implementación

## Contexto

El sistema visual implementado hasta ahora (paleta `tfl-night`/`tfl-sky`/`tfl-bone`, fondo animado tipo "seda" en canvas) se descarta por completo. Jonathan pidió reconstruir el branding desde cero, sin usar la implementación anterior como referencia — únicamente la especificación del producto (`TFLives_Especificacion_Integral_del_Proyecto.pdf`, sección 23 "Diseño visual y experiencia") y una investigación de mercado actual (SaaS/tech premium 2026, plataformas gaming/streaming, networks de Minecraft).

## Restricciones no negociables (vienen del PDF, no se reinterpretan)

- Estilo: premium, minimalista, futurista, oscuro como base.
- Color principal: azul en diferentes tonos. Color secundario: blanco y neutros fríos.
- Geometría: esquinas ligeramente redondeadas.
- Modos claro y oscuro reales, ambos completos.
- Efectos: cristal/transparencias, brillos azules, gradientes, partículas, movimiento al desplazarse.
- Animación equilibrada: no debe perjudicar velocidad ni claridad.
- Áreas sociales cercanas a Discord sin copiarlo; paneles con sensación de app moderna.

## Hallazgos de la investigación (2026)

- **Dark-mode-first con un solo acento**: ~75% de los sitios SaaS de diseño destacado usan un único color de acento sobre gris oscuro neutro (nunca negro puro) — patrón Linear/Raycast/Cursor. Confirma la instrucción del PDF de "azul" como acento único, no una paleta de varios azules.
- **Geometría nítida por sobre sombras difusas**: la tendencia premium 2026 se aleja de `box-shadow` pesados y blur excesivo, prefiriendo bordes de 1px sólidos y esquinas con redondeo moderado (no brutalista, no exageradamente redondeado).
- **Glassmorphism sigue vigente**, especialmente en fintech/AI/dashboards premium — pero usado en superficies elevadas puntuales (nav, modales, cards destacadas), no como textura global.
- **El movimiento decorativo permanente pierde terreno**: la tendencia es que la animación comunique estado o guíe atención (hover, scroll, transiciones), no loops de fondo constantes sin propósito. Esto también reduce costo de rendimiento.
- No se encontró información específica y verificable sobre el rediseño visual reciente de networks de Minecraft grandes (Hypixel, Wynncraft, CubeCraft) — se usa como referencia general de convenciones de comunidades gaming, no de diseño visual puntual.

## Dirección de diseño

### Color
- Fondo base: gris oscuro neutro-frío (no negro puro, no navy saturado).
- Acento único: azul, expresado en 2–3 intensidades (no una paleta amplia de azules).
- Superficies elevadas (cards, nav, modales): un escalón más claras que el fondo base.
- Modo claro: implementación completa y real, no un fallback a medio hacer.

### Superficies y materialidad
- Bordes finos y nítidos como recurso principal de separación visual.
- Sombras difusas grandes evitadas; se prioriza contraste de superficie + borde.
- Glassmorphism (blur + transparencia) reservado a superficies elevadas puntuales: navbar, modales, cards destacadas — no aplicado como textura de fondo global.
- Esquinas con redondeo sutil, consistente en todos los componentes vía tokens (no valores hardcodeados por componente).

### Movimiento y fondo
- Se elimina el fondo animado en canvas (`silk-background.tsx`) por completo.
- Fondo global: estático (gradiente sutil o textura tipo grid/dot de muy baja opacidad con el azul de acento). Sin animación corriendo de forma permanente.
- "Partículas" y "brillos azules" del PDF se expresan como acentos puntuales y acotados (por ejemplo, detrás del hero de portada), nunca como simulación global corriendo siempre.
- "Movimiento al desplazarse" se resuelve con scroll-reveal (fade/slide al entrar en viewport) en vez de animación de fondo continua — es el tipo de movimiento "con propósito" que marca la tendencia 2026.
- Toda animación respeta `prefers-reduced-motion` (ya es regla del proyecto, sección 4 de las reglas de TFLives).

### Tipografía
- Se mantiene una sans geométrica para UI (familia Inter/Geist ya presente) y una display distintiva tipo grotesk geométrico (familia Space Grotesk ya presente) — es la familia tipográfica dominante en sitios premium tech 2026 según la investigación, y ya está correctamente cargada vía `next/font` en el proyecto. No se identificó una razón para cambiarla; es una decisión técnica de bajo riesgo, no parte del "branding viejo" a descartar.

## Alcance de la implementación

**Se reconstruye desde cero:**
- Paleta de colores completa (`tailwind.config.ts`, variables CSS en `globals.css`) — se elimina la paleta `tfl.*` entera.
- Todos los componentes que hoy usan clases `tfl-*` hardcodeadas se migran a los tokens semánticos nuevos (`background`, `foreground`, `primary`, `card`, `border`, etc.), ya establecidos como convención del proyecto.
- Se elimina `src/components/effects/silk-background.tsx` y su uso en `layout.tsx`.
- Nuevo fondo estático global (gradiente/grid sutil) en su reemplazo.

**No cambia:**
- La arquitectura de tokens semánticos + `next-themes` para claro/oscuro (ya construida en la Tarea #2 anterior) — se reutiliza, solo cambian los *valores* de los tokens, no el mecanismo.
- Componentes funcionales no visuales (lógica de auth, formularios, validaciones).

## Fuera de alcance de este documento

- Contenido/copy de las páginas.
- Nuevas páginas públicas no existentes hoy (eso es trabajo de otra tarea, "páginas públicas").
- El efecto de partículas puntual del hero se define en el plan de implementación, no acá — puede resolverse con CSS puro o una librería liviana, a decidir según performance real.
