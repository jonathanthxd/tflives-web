# TFLives Web — Avatar Frames 4.0 (Next Level)

## Objetivo

Llevar los Avatar Frames más allá de “aro bonito + animación” y consolidarlos como micro-escenas temáticas alrededor del avatar. La prioridad fue mantener el avatar circular, pero hacer que el **comportamiento** y la **silueta** pertenezcan al tema del cosmético, no a un disco girando.

## Principios de diseño aplicados

1. **La foto sigue siendo el centro circular.**
2. **El frame no actúa como un vinilo.**
3. Cada preset combina cuatro capas:
   - **Ring/Base**: lectura principal del frame.
   - **Motif**: forma temática estructural.
   - **Signature**: identidad del preset (rama, HUD, corona, halo, etc.).
   - **Ambient**: partículas, brillo, neblina, spray, polvo, etc.
4. Los movimientos deben ser **semánticos**:
   - Sakura = pétalos que caen.
   - Inferno = llamas y brasas.
   - Frost = cristales y destellos.
   - Circuit = nodos y señales.
   - Royal = corona, filigrana y gemas.
5. Los ornamentos externos no deben quedar presos de un recorte circular del contenedor.

## Ejecución implementada

### Renderer

- Se añadieron dos capas nuevas a los Avatar Frames:
  - `cosmetic-avatar-frame__signature`
  - `cosmetic-avatar-frame__ambient`
- Se aumentó el número de piezas por preset para permitir más microdetalles.
- Se amplió la preview del catálogo para que los marcos luzcan mejor (`h-32`, avatar `size-16`).

### CSS / Motion language

Se añadieron mejoras específicas por preset:

- **Forged Bronze**: aro de hardware más complejo, brillos de remaches y halo técnico.
- **Monochrome**: brackets arquitectónicos y beacon dual.
- **Ocean**: spray de espuma, ondas secundarias y más burbujas.
- **Rose Pulse**: doble traza ECG y halo de pulso escalonado.
- **Frost**: cristales auxiliares, destellos ambientales y cruces de hielo.
- **Emerald Circuit**: señal vertical central, trazas laterales y nodos extra.
- **Inferno**: crestas de fuego superiores, heat haze y brasas adicionales.
- **Toxic**: goteos extra, humos ácidos y ooze superior.
- **Prism**: anillo refractivo, glints y shards flotantes adicionales.
- **Cyber Grid**: brackets HUD, escaneo horizontal + vertical y nodos laterales.
- **Sakura**: rama viva, blossom cluster y lluvia de pétalos reforzada.
- **Void**: shear central, bruma gravitacional y motas adicionales atraídas al núcleo.
- **Solar Flare**: corona solar adicional y destellos de plasma.
- **Royal Gold**: filigrana inferior, gemas suplementarias y polvo dorado.
- **Nebula**: wisps más amplios, polvo interestelar y estrellas adicionales.
- **Galaxy**: órbita secundaria/satélite, neblina espacial y brillos extras.

## Archivos tocados

- `src/modules/cosmetics/components/cosmetic-renderer.tsx`
- `src/styles/globals.css`
- `tests/unit/cosmetics.test.ts`

## Compatibilidad

- No cambia compras.
- No cambia ownership.
- No cambia catálogo.
- No cambia presets ni slugs.
- No requiere migraciones ni dependencias nuevas.
