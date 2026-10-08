# TFLives v0.19.0 — Studio Engine V2

Base: `main` v0.18, commit `86a4f572da3204721e7a6fb7f89191dfe8acbb1f`.

## Recorrido y decisiones

El botón de la barra abre ajustes rápidos: tema, 17 acentos y fondo. El editor completo se importa al activarlo (o por intención de foco/puntero en su entrada). General, Colores, Fondos, Tipografía, Cursores, Perfil/cosméticos y Presets tienen controles reales. En escritorio hay navegación, una vista previa y un inspector con scroll independiente. En móvil el diálogo ocupa la pantalla, con navegación horizontal y desplazamiento del contenido. El diálogo nativo contiene el foco, cierra con Escape y devuelve el foco al disparador; restaura el scroll del documento al desmontarse. Las confirmaciones destructivas conservan el componente existente.

La vista previa usa el renderer real del fondo seleccionado. El fondo global queda pausado mientras está abierto el editor completo. Las galerías usan posters CSS y no crean siete contextos gráficos. La categoría de cosméticos consulta el inventario existente, muestra exclusivamente los elementos obtenidos/equipados y respeta las condiciones Premium. No compra ni equipa desde un flujo nuevo; ofrece acceso al inventario habitual.

## Motor declarativo

`src/shared/studio/appearance.ts` define capacidades, controles, rangos, pasos, valores originales y compatibilidad de tema. `config.ts` conserva todos los identificadores anteriores. `storage.ts` valida el árbol completo y no acepta CSS, URLs ni código arbitrarios como recetas. Los controles se aplican inmediatamente y Revertir restaura la instantánea tomada al abrir el editor. Restaurar apariencia requiere confirmación y conserva los presets personales.

La clave antigua `tflives-studio-v1` se lee cuando V2 no es válida. La migración escribe una copia sanitizada bajo `tflives-studio-v2`, comprueba su lectura y nunca elimina ni reescribe V1. JSON corrupto, propiedades desconocidas, valores infinitos y acceso/cuota bloqueados usan valores seguros; la interfaz distingue cambios guardados de cambios que solo duran en la pestaña.

Los presets personales permanecen locales: máximo 12 y nombres de 1–40 caracteres. Se pueden crear, aplicar, renombrar y eliminar con confirmación. Los ocho incluidos son TFL Original, Midnight, Sakura, Cyber, Frost, Aurora, Ember y Minimal. Usan fondos y fuentes existentes; aplicar un preset puede descargar la fuente o el motor elegido. No se añaden tablas ni migraciones.

## Background Composer

Blur, oscurecimiento, brillo, saturación, viñeta y opacidad actúan en capas del fondo. El texto, las tarjetas y los controles están fuera de la capa filtrada. Los valores neutros son `0, 0, 1, 1, 0, 1`, respectivamente. El margen de blur evita bordes recortados. La política de fondos animados solo en oscuro continúa vigente.

| Motor | Controles del motor |
|---|---|
| Silk | Velocidad, escala, rotación, ruido |
| Ghost Fibers | Velocidad, escala, rotación, brillo del resplandor |
| CRT Warp | Velocidad, curvatura, scanlines, bloom, interacción |
| Molten Metal | Velocidad, escala, glow, remolino |
| Gradient Waves | Velocidad, amplitud, zoom, interacción |
| Prism | Velocidad temporal, escala, glow, ruido |
| Line Waves | Velocidad, deformación, rotación, interacción |

Se mantienen shaders, calidad, detalle, cámaras y valores originales. Prism y Line Waves actualizan sus uniforms sin reconstruir el contexto por cada ajuste; sus contextos se liberan al sustituir o desmontar el fondo. La pausa de la vista previa y la visibilidad de la pestaña/superficie suspenden el trabajo; un cambio de ajuste pausado puede dibujar una imagen de actualización. Se conserva el DPR de Silk `[1,2]`, y los DPR/FPS del resto: no se redujo calidad para mejorar las cifras.

## Renderer cosmético

Las 16 recetas de marcos son una allowlist controlada en `modules/cosmetics/recipes.ts`, con paleta, variante, capas, silueta, movimiento semántico y cantidad de piezas. El renderer mantiene el orden de las siete capas anteriores y los detalles originales; Sakura conserva 18 piezas. Los estilos y keyframes originales siguen en `globals.css`. La observación de visibilidad pausa decoraciones CSS fuera de pantalla y en pestañas ocultas, con limpieza de observers, listeners y variables. No se añade Three.js a un marco CSS. Nombre, insignia, banner y acento siguen las definiciones del catálogo existente.

Se extrajo el predicado de vigencia Premium a un módulo puro y se reexporta para compatibilidad. No se modifican precios, inventario, compras, equipamiento, ledger, roles ni permisos.

## Tarjetas públicas

Ver [Dynamic Profile Cards](V0_19_DYNAMIC_PROFILE_CARDS.md). La política de economía v0.7 declara privado el saldo de monedas. La nueva tarjeta muestra “Privado/Private”; además se retira el saldo de la proyección del perfil público que anteriormente lo serializaba. No cambia ninguna operación de cartera: su API mantiene el alcance de la cuenta autenticada.

## Validación y medición

Los resultados y límites se completan en el informe de entrega después de ejecutar la matriz final. La referencia v0.18 se recompiló desde el commit base en un checkout aislado, con dependencias físicas y las mismas fuentes reales del caché. Se registraron 72 estados de navegación y una fase separada de 32 estados con interacciones. Estos resultados no equivalen a RUM ni a equipos móviles físicos. Las medidas GPU del laboratorio usan Chromium con SwiftShader; no permiten afirmar consumo energético en un dispositivo real.

Pruebas nuevas: almacenamiento/migración/presets/rangos/defaults; las 16 recetas renderizadas; proyección OG con Postgres real aislado, aliases, likes PROFILE y logros activos; privacidad, allowlist de avatar, límite de bytes, fallo de carga y PNG reales ES/EN. Las pruebas antiguas de recetas se adaptan a la nueva ubicación de los datos, conservando sus garantías; ninguna se deshabilita.

## Fuentes técnicas

Se consultaron las guías incluidas en Next 16.3.8 para `ImageResponse`, metadata, `use cache` y `cacheLife`, y Context7 `/vercel/next.js`. La estructura del diálogo conserva las expectativas de [Dialog](https://www.radix-ui.com/primitives/docs/components/dialog): foco contenido, Escape y devolución al disparador. La dirección visual se trabajó en Superdesign a partir de los componentes, tokens y logo reales; la implementación no incorpora sus avatares de ejemplo.
