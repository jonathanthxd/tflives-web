-- Final production reconciliation for the TFLives cosmetic catalogue.
--
-- Goals:
-- 1. Keep exactly the 80 official purchasable cosmetics.
-- 2. Normalize any legacy/test rows that already use an official slug.
-- 3. Preserve ownership when a legacy row used the same safe visual preset as an official cosmetic.
-- 4. Remove every remaining non-official/test cosmetic before public production.
--
-- This migration intentionally does not refund TFL Coins for pre-production/test cosmetics.
-- Existing ownership is migrated to the canonical item whenever a matching visual preset exists.

CREATE TEMP TABLE "_TflOfficialCosmetics" (
  id TEXT NOT NULL,
  slug TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_en TEXT NOT NULL,
  price INTEGER NOT NULL,
  premium_only BOOLEAN NOT NULL,
  visual_preset TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO "_TflOfficialCosmetics"
  (id,slug,type,rarity,name_es,description_es,name_en,description_en,price,premium_only,visual_preset)
VALUES
('official-cosmetic-001','bronze-frame','AVATAR_FRAME','COMMON','Bronce Forjado','Un marco metálico de doble aro con reflejos cálidos y profundidad forjada.','Forged Bronze','A double-ring metal frame with warm reflections and forged depth.',150,FALSE,'BRONZE_FRAME'),
('official-cosmetic-002','monochrome-frame','AVATAR_FRAME','COMMON','Monocromo','Un marco limpio de alto contraste con doble línea y acabado editorial.','Monochrome','A clean high-contrast frame with double lines and an editorial finish.',200,FALSE,'MONOCHROME_FRAME'),
('official-cosmetic-003','ocean-frame','AVATAR_FRAME','COMMON','Marea Azul','Dos ondas luminosas rodean el avatar con una sensación acuática continua.','Blue Tide','Two luminous waves surround the avatar with a continuous aquatic feel.',260,FALSE,'OCEAN_FRAME'),
('official-cosmetic-004','rose-pulse-frame','AVATAR_FRAME','COMMON','Pulso Rosa','Un halo rose respira alrededor del avatar con pulsos suaves y definidos.','Rose Pulse','A rose halo breathes around the avatar with soft, defined pulses.',320,FALSE,'ROSE_PULSE_FRAME'),
('official-cosmetic-005','frost-frame','AVATAR_FRAME','RARE','Cristal Ártico','Bordes cristalinos y destellos fríos construyen una silueta helada.','Arctic Crystal','Crystalline edges and cold highlights build an icy silhouette.',480,FALSE,'FROST_FRAME'),
('official-cosmetic-006','emerald-circuit-frame','AVATAR_FRAME','RARE','Circuito Esmeralda','Esquinas técnicas y trazos luminosos convierten el avatar en una pieza de circuito.','Emerald Circuit','Technical corners and luminous traces turn the avatar into a circuit piece.',560,FALSE,'EMERALD_CIRCUIT_FRAME'),
('official-cosmetic-007','inferno-frame','AVATAR_FRAME','RARE','Infierno','Arcos incandescentes recorren el borde con una energía de llama contenida.','Inferno','Incandescent arcs travel the edge with contained flame energy.',650,FALSE,'INFERNO_FRAME'),
('official-cosmetic-008','toxic-frame','AVATAR_FRAME','RARE','Tóxico','Un resplandor ácido con puntos reactivos da al marco una presencia venenosa.','Toxic','An acidic glow with reactive dots gives the frame a toxic presence.',740,FALSE,'TOXIC_FRAME'),
('official-cosmetic-009','prism-frame','AVATAR_FRAME','EPIC','Prisma','Un aro prismático animado recorre varios tonos sin perder legibilidad.','Prism','An animated prismatic ring travels through several tones without losing readability.',950,FALSE,'PRISM_FRAME'),
('official-cosmetic-010','cybergrid-frame','AVATAR_FRAME','EPIC','Rejilla Cibernética','Segmentos digitales y marcas orbitales crean un marco de interfaz futurista.','Cyber Grid','Digital segments and orbital marks create a futuristic interface frame.',1100,FALSE,'CYBERGRID_FRAME'),
('official-cosmetic-011','sakura-frame','AVATAR_FRAME','EPIC','Sakura','Pequeños pétalos luminosos orbitan un aro rosado de acabado suave.','Sakura','Small luminous petals orbit a soft pink ring.',1300,FALSE,'SAKURA_FRAME'),
('official-cosmetic-012','void-frame','AVATAR_FRAME','EPIC','Vacío','Un eclipse oscuro absorbe el borde y deja un filo violeta de alta energía.','Void','A dark eclipse absorbs the edge and leaves a high-energy violet rim.',1500,TRUE,'VOID_FRAME'),
('official-cosmetic-013','solar-flare-frame','AVATAR_FRAME','LEGENDARY','Erupción Solar','Rayos cortos y un núcleo dorado convierten el avatar en un pequeño sol.','Solar Flare','Short rays and a golden core turn the avatar into a small sun.',1900,FALSE,'SOLAR_FLARE_FRAME'),
('official-cosmetic-014','royal-gold-frame','AVATAR_FRAME','LEGENDARY','Oro Real','Doble borde dorado, joya superior y glow púrpura para una presencia de élite.','Royal Gold','A double gold edge, top jewel and purple glow create an elite presence.',2300,FALSE,'ROYAL_GOLD_FRAME'),
('official-cosmetic-015','nebula-frame','AVATAR_FRAME','LEGENDARY','Nebulosa','Nubes de luz y partículas orbitales rodean el avatar como una nebulosa compacta.','Nebula','Light clouds and orbital particles surround the avatar like a compact nebula.',2800,FALSE,'NEBULA_FRAME'),
('official-cosmetic-016','galaxy-frame','AVATAR_FRAME','LEGENDARY','Galaxia','Órbitas, estrellas y un aro cromático forman el marco más profundo del catálogo.','Galaxy','Orbits, stars and a chromatic ring form the deepest frame in the catalogue.',3400,TRUE,'GALAXY_FRAME'),
('official-cosmetic-017','aurora-accent','PROFILE_ACCENT','COMMON','Aurora','Auroras suaves atraviesan el perfil y conectan las superficies con luz fría.','Aurora','Soft auroras cross the profile and connect surfaces with cool light.',120,FALSE,'AURORA_ACCENT'),
('official-cosmetic-018','amber-accent','PROFILE_ACCENT','COMMON','Ámbar','Un halo cálido refuerza bordes, tarjetas y detalles importantes del perfil.','Amber','A warm halo reinforces borders, cards and important profile details.',170,FALSE,'AMBER_ACCENT'),
('official-cosmetic-019','monochrome-accent','PROFILE_ACCENT','COMMON','Monocromo','Contraste limpio, líneas claras y sombras neutras para un perfil editorial.','Monochrome','Clean contrast, crisp lines and neutral shadows for an editorial profile.',220,FALSE,'MONOCHROME_ACCENT'),
('official-cosmetic-020','cobalt-accent','PROFILE_ACCENT','COMMON','Cobalto','Haces azules recorren el fondo del perfil y marcan sus secciones principales.','Cobalt','Blue beams travel across the profile background and mark its main sections.',280,FALSE,'COBALT_ACCENT'),
('official-cosmetic-021','emerald-accent','PROFILE_ACCENT','RARE','Esmeralda','Una retícula esmeralda muy sutil refuerza la profundidad de cada superficie.','Emerald','A very subtle emerald grid reinforces the depth of every surface.',400,FALSE,'EMERALD_ACCENT'),
('official-cosmetic-022','rose-accent','PROFILE_ACCENT','RARE','Rosa Intenso','Bloom rose concentrado alrededor del encabezado y las tarjetas clave.','Rose Intense','Concentrated rose bloom around the header and key cards.',480,FALSE,'ROSE_ACCENT'),
('official-cosmetic-023','crimson-accent','PROFILE_ACCENT','RARE','Carmesí','Trazos diagonales carmesí añaden energía sin tapar el contenido.','Crimson','Crimson diagonal strokes add energy without covering content.',560,FALSE,'CRIMSON_ACCENT'),
('official-cosmetic-024','frost-accent','PROFILE_ACCENT','RARE','Escarcha','Luz blanca fría y bordes cristalinos hacen que el perfil se sienta helado.','Frost','Cold white light and crystalline edges make the profile feel frozen.',650,FALSE,'FROST_ACCENT'),
('official-cosmetic-025','sunset-accent','PROFILE_ACCENT','EPIC','Atardecer','Tres tonos cálidos recorren la página como un atardecer extendido.','Sunset','Three warm tones travel across the page like an extended sunset.',850,FALSE,'SUNSET_ACCENT'),
('official-cosmetic-026','cyber-accent','PROFILE_ACCENT','EPIC','Cibernético','Líneas técnicas y nodos suaves convierten el perfil en una interfaz futurista.','Cyber','Technical lines and soft nodes turn the profile into a futuristic interface.',1000,FALSE,'CYBER_ACCENT'),
('official-cosmetic-027','toxic-accent','PROFILE_ACCENT','EPIC','Tóxico','Brillos verdes ácidos aparecen en bordes y puntos de profundidad del perfil.','Toxic','Acid green highlights appear on profile edges and depth points.',1180,FALSE,'TOXIC_ACCENT'),
('official-cosmetic-028','obsidian-accent','PROFILE_ACCENT','EPIC','Obsidiana','Una atmósfera oscura con reflejos índigo da al perfil un acabado profundo.','Obsidian','A dark atmosphere with indigo reflections gives the profile a deep finish.',1380,TRUE,'OBSIDIAN_ACCENT'),
('official-cosmetic-029','sakura-accent','PROFILE_ACCENT','LEGENDARY','Sakura','Puntos y pétalos luminosos suavizan el perfil con un ambiente rosado.','Sakura','Luminous dots and petals soften the profile with a pink atmosphere.',1750,FALSE,'SAKURA_ACCENT'),
('official-cosmetic-030','royal-accent','PROFILE_ACCENT','LEGENDARY','Regio','Oro y púrpura se combinan en líneas de lujo y halos controlados.','Royal','Gold and purple combine in luxury lines and controlled halos.',2150,FALSE,'ROYAL_ACCENT'),
('official-cosmetic-031','plasma-accent','PROFILE_ACCENT','LEGENDARY','Plasma','Campos cromáticos de alto contraste recorren el perfil con energía eléctrica.','Plasma','High-contrast chromatic fields travel across the profile with electric energy.',2600,FALSE,'PLASMA_ACCENT'),
('official-cosmetic-032','cosmic-accent','PROFILE_ACCENT','LEGENDARY','Cósmico','Estrellas, halos y profundidad multicolor convierten el perfil en un espacio propio.','Cosmic','Stars, halos and multicolor depth turn the profile into its own space.',3200,TRUE,'COSMIC_ACCENT'),
('official-cosmetic-033','star-badge','PROFILE_BADGE','COMMON','Estrella','Una estrella luminosa para perfiles que quieren destacar sin exagerar.','Star','A luminous star for profiles that want to stand out without overdoing it.',100,FALSE,'STAR_BADGE'),
('official-cosmetic-034','heart-badge','PROFILE_BADGE','COMMON','Corazón','Un corazón compacto con glow rose y acabado brillante.','Heart','A compact heart with rose glow and a glossy finish.',140,FALSE,'HEART_BADGE'),
('official-cosmetic-035','bolt-badge','PROFILE_BADGE','COMMON','Rayo','Un rayo eléctrico con borde energético y contraste alto.','Bolt','An electric bolt with an energetic edge and high contrast.',180,FALSE,'BOLT_BADGE'),
('official-cosmetic-036','moon-badge','PROFILE_BADGE','COMMON','Luna','Una media luna fría con halo nocturno y profundidad violeta.','Moon','A cool crescent moon with a nocturnal halo and violet depth.',240,FALSE,'MOON_BADGE'),
('official-cosmetic-037','gem-badge','PROFILE_BADGE','RARE','Gema','Una gema facetada con brillo interno y borde prismático.','Gem','A faceted gem with inner glow and a prismatic edge.',340,FALSE,'GEM_BADGE'),
('official-cosmetic-038','flame-badge','PROFILE_BADGE','RARE','Llama','Una insignia incandescente para perfiles con energía intensa.','Flame','An incandescent badge for profiles with intense energy.',420,FALSE,'FLAME_BADGE'),
('official-cosmetic-039','snow-badge','PROFILE_BADGE','RARE','Copo de Nieve','Un copo cristalino con reflejos blancos y azules.','Snowflake','A crystalline snowflake with white and blue reflections.',500,FALSE,'SNOW_BADGE'),
('official-cosmetic-040','sun-badge','PROFILE_BADGE','RARE','Sol','Un sol compacto con corona cálida y centro luminoso.','Sun','A compact sun with a warm corona and luminous center.',580,FALSE,'SUN_BADGE'),
('official-cosmetic-041','ghost-badge','PROFILE_BADGE','EPIC','Espectro','Un emblema espectral con borde difuso y núcleo violeta.','Specter','A spectral emblem with a diffuse edge and violet core.',720,FALSE,'GHOST_BADGE'),
('official-cosmetic-042','sword-badge','PROFILE_BADGE','EPIC','Espada','Metal frío y destello vertical para una insignia de combate.','Sword','Cold metal and a vertical highlight for a combat badge.',850,FALSE,'SWORD_BADGE'),
('official-cosmetic-043','shield-badge','PROFILE_BADGE','EPIC','Escudo','Un escudo azul con borde doble y brillo de protección.','Shield','A blue shield with a double edge and protective glow.',1000,FALSE,'SHIELD_BADGE'),
('official-cosmetic-044','spark-badge','PROFILE_BADGE','EPIC','Chispa','Una chispa fina con bloom magenta y pulso corto.','Spark','A fine spark with magenta bloom and a short pulse.',1200,TRUE,'SPARK_BADGE'),
('official-cosmetic-045','orbit-badge','PROFILE_BADGE','LEGENDARY','Órbita','Un núcleo central rodeado por una órbita luminosa.','Orbit','A central core surrounded by a luminous orbit.',1500,FALSE,'ORBIT_BADGE'),
('official-cosmetic-046','pixel-badge','PROFILE_BADGE','LEGENDARY','Pixel','Una insignia pixelada con borde escalonado y brillo digital.','Pixel','A pixel badge with stepped edges and digital glow.',1850,FALSE,'PIXEL_BADGE'),
('official-cosmetic-047','diamond-badge','PROFILE_BADGE','LEGENDARY','Diamante','Un diamante limpio con halo prismático y reflejo blanco.','Diamond','A clean diamond with a prismatic halo and white reflection.',2250,FALSE,'DIAMOND_BADGE'),
('official-cosmetic-048','crown-badge','PROFILE_BADGE','LEGENDARY','Corona','Corona dorada con halo real y acabado de máxima presencia.','Crown','A golden crown with royal halo and maximum-presence finish.',2800,TRUE,'CROWN_BADGE'),
('official-cosmetic-049','violet-nameplate','NAMEPLATE','COMMON','Violeta','Una placa violeta profunda con borde luminoso y buen contraste.','Violet','A deep violet plate with a luminous edge and strong contrast.',130,FALSE,'VIOLET_NAMEPLATE'),
('official-cosmetic-050','neon-cyan-nameplate','NAMEPLATE','COMMON','Neón Cian','Texto luminoso cyan con tubo neón y halo controlado.','Neon Cyan','Luminous cyan text with a neon-tube edge and controlled halo.',180,FALSE,'NEON_CYAN_NAMEPLATE'),
('official-cosmetic-051','rose-nameplate','NAMEPLATE','COMMON','Rosa','Una placa rose suave con glow interior y borde brillante.','Rose','A soft rose plate with inner glow and bright edge.',240,FALSE,'ROSE_NAMEPLATE'),
('official-cosmetic-052','emerald-nameplate','NAMEPLATE','COMMON','Esmeralda','Cristal verde con borde esmeralda y profundidad translúcida.','Emerald','Green glass with an emerald edge and translucent depth.',300,FALSE,'EMERALD_NAMEPLATE'),
('official-cosmetic-053','frost-nameplate','NAMEPLATE','RARE','Escarcha','Placa helada con acabado translúcido y reflejos blancos.','Frost','An icy plate with a translucent finish and white reflections.',420,FALSE,'FROST_NAMEPLATE'),
('official-cosmetic-054','inferno-nameplate','NAMEPLATE','RARE','Infierno','Borde cálido y resplandor rojo para un nombre de alta energía.','Inferno','A warm edge and red glow for a high-energy name.',500,FALSE,'INFERNO_NAMEPLATE'),
('official-cosmetic-055','matrix-nameplate','NAMEPLATE','RARE','Matriz','Tipografía técnica y barrido digital verde inspirado en terminales.','Matrix','Technical typography and a green digital sweep inspired by terminals.',600,FALSE,'MATRIX_NAMEPLATE'),
('official-cosmetic-056','pixel-nameplate','NAMEPLATE','RARE','Pixel','Bordes cuadrados, sombra escalonada y lectura retro digital.','Pixel','Square edges, stepped shadow and retro-digital readability.',700,FALSE,'PIXEL_NAMEPLATE'),
('official-cosmetic-057','molten-nameplate','NAMEPLATE','EPIC','Fundido','Gradiente metálico caliente que se mueve lentamente a través del nombre.','Molten','A hot metallic gradient that moves slowly across the name.',880,FALSE,'MOLTEN_NAMEPLATE'),
('official-cosmetic-058','aurora-nameplate','NAMEPLATE','EPIC','Aurora','Tres tonos recorren la placa con un brillo aurora elegante.','Aurora','Three tones travel across the plate with an elegant aurora glow.',1050,FALSE,'AURORA_NAMEPLATE'),
('official-cosmetic-059','chrome-nameplate','NAMEPLATE','EPIC','Cromo','Reflejo metálico blanco, gris y oscuro para un acabado cromado real.','Chrome','White, gray and dark metallic reflections create a true chrome finish.',1250,FALSE,'CHROME_NAMEPLATE'),
('official-cosmetic-060','sunset-nameplate','NAMEPLATE','EPIC','Atardecer','Atardecer naranja, rose y violeta con brillo lateral.','Sunset','Orange, rose and violet sunset tones with a side glow.',1450,TRUE,'SUNSET_NAMEPLATE'),
('official-cosmetic-061','royal-nameplate','NAMEPLATE','LEGENDARY','Regio','Oro y púrpura en una placa con borde doble y acabado de élite.','Royal','Gold and purple in a plate with a double edge and elite finish.',1850,FALSE,'ROYAL_NAMEPLATE'),
('official-cosmetic-062','void-nameplate','NAMEPLATE','LEGENDARY','Vacío','Oscuridad profunda con filo violeta y brillo concentrado.','Void','Deep darkness with a violet rim and concentrated glow.',2250,FALSE,'VOID_NAMEPLATE'),
('official-cosmetic-063','holographic-nameplate','NAMEPLATE','LEGENDARY','Holográfica','Color iridiscente que recorre el texto como una lámina holográfica.','Holographic','Iridescent color travels across the text like a holographic foil.',2750,FALSE,'HOLOGRAPHIC_NAMEPLATE'),
('official-cosmetic-064','galaxy-nameplate','NAMEPLATE','LEGENDARY','Galaxia','Estrellas diminutas y gradiente cósmico convierten el nombre en una pieza central.','Galaxy','Tiny stars and a cosmic gradient turn the name into a centerpiece.',3300,TRUE,'GALAXY_NAMEPLATE'),
('official-cosmetic-065','sunset-banner','BANNER_STYLE','COMMON','Atardecer','Un velo de atardecer mezcla naranja, rose y violeta sobre cualquier banner.','Sunset','A sunset veil blends orange, rose and violet over any banner.',160,FALSE,'SUNSET_BANNER'),
('official-cosmetic-066','glass-banner','BANNER_STYLE','COMMON','Cristal','Reflejos de cristal y pequeñas líneas de luz añaden profundidad sin ocultar la imagen.','Glass','Glass reflections and small light lines add depth without hiding the image.',220,FALSE,'GLASS_BANNER'),
('official-cosmetic-067','ocean-banner','BANNER_STYLE','COMMON','Océano','Ondas suaves y caústicas azules recorren la superficie del banner.','Ocean','Soft waves and blue caustics travel across the banner surface.',280,FALSE,'OCEAN_BANNER'),
('official-cosmetic-068','sakura-banner','BANNER_STYLE','COMMON','Sakura','Pétalos y luz rose flotan sobre el banner con una estética suave.','Sakura','Petals and rose light float over the banner with a soft aesthetic.',340,FALSE,'SAKURA_BANNER'),
('official-cosmetic-069','grid-banner','BANNER_STYLE','RARE','Retícula','Retícula técnica y glow de horizonte para una portada digital.','Grid','A technical grid and horizon glow create a digital cover.',460,FALSE,'GRID_BANNER'),
('official-cosmetic-070','frost-banner','BANNER_STYLE','RARE','Escarcha','Cristales geométricos y neblina fría se superponen a la imagen.','Frost','Geometric crystals and cold mist overlay the image.',560,FALSE,'FROST_BANNER'),
('official-cosmetic-071','liquid-banner','BANNER_STYLE','RARE','Líquido','Manchas fluidas y refracción cromática generan una capa líquida.','Liquid','Fluid shapes and chromatic refraction generate a liquid layer.',680,FALSE,'LIQUID_BANNER'),
('official-cosmetic-072','cyber-banner','BANNER_STYLE','RARE','Cibernético','Líneas HUD, nodos y barridos horizontales crean una interfaz futurista.','Cyber','HUD lines, nodes and horizontal sweeps create a futuristic interface.',800,FALSE,'CYBER_BANNER'),
('official-cosmetic-073','aurora-banner','BANNER_STYLE','EPIC','Aurora','Cintas aurora se mueven lentamente sobre la imagen sin cubrirla por completo.','Aurora','Aurora ribbons move slowly over the image without fully covering it.',980,FALSE,'AURORA_BANNER'),
('official-cosmetic-074','nebula-banner','BANNER_STYLE','EPIC','Nebulosa','Nubes cósmicas y puntos estelares añaden profundidad espacial.','Nebula','Cosmic clouds and star points add spatial depth.',1180,FALSE,'NEBULA_BANNER'),
('official-cosmetic-075','crt-banner','BANNER_STYLE','EPIC','CRT','Scanlines, aberración cromática y glow convierten el banner en una pantalla CRT.','CRT','Scanlines, chromatic aberration and glow turn the banner into a CRT display.',1400,FALSE,'CRT_BANNER'),
('official-cosmetic-076','molten-banner','BANNER_STYLE','EPIC','Fundido','Vetado incandescente y reflejos metálicos calientes recorren la portada.','Molten','Incandescent veining and hot metallic reflections travel across the cover.',1650,TRUE,'MOLTEN_BANNER'),
('official-cosmetic-077','prismatic-banner','BANNER_STYLE','LEGENDARY','Prismático','Un espectro prismático diagonal cambia la lectura de la portada con luz multicolor.','Prismatic','A diagonal prismatic spectrum reshapes the cover with multicolor light.',2100,FALSE,'PRISMATIC_BANNER'),
('official-cosmetic-078','starfield-banner','BANNER_STYLE','LEGENDARY','Campo Estelar','Un campo de estrellas de distintas intensidades añade profundidad nocturna.','Starfield','A field of stars at different intensities adds nocturnal depth.',2500,FALSE,'STARFIELD_BANNER'),
('official-cosmetic-079','royal-banner','BANNER_STYLE','LEGENDARY','Regio','Marcos dorados y halo púrpura convierten la portada en una pieza real.','Royal','Golden frames and a purple halo turn the cover into a royal piece.',3000,FALSE,'ROYAL_BANNER'),
('official-cosmetic-080','void-banner','BANNER_STYLE','LEGENDARY','Vacío','Sombras profundas, eclipse central y filo violeta dominan la portada.','Void','Deep shadows, a central eclipse and violet rim dominate the cover.',3600,TRUE,'VOID_BANNER');

-- Upsert the canonical catalogue. If one of the old/random cosmetics already
-- used an official slug, its row is renamed/rebalanced in place so owners keep it.
INSERT INTO "Cosmetic"
  (id,slug,type,rarity,name,description,name_en,description_en,price,"premiumOnly",active,"visualPreset","createdAt","updatedAt")
SELECT
  spec.id,
  spec.slug,
  spec.type::"CosmeticType",
  spec.rarity::"CosmeticRarity",
  spec.name_es,
  spec.description_es,
  spec.name_en,
  spec.description_en,
  spec.price,
  spec.premium_only,
  TRUE,
  spec.visual_preset::"CosmeticVisualPreset",
  now(),
  now()
FROM "_TflOfficialCosmetics" spec
ON CONFLICT (slug) DO UPDATE SET
  type = EXCLUDED.type,
  rarity = EXCLUDED.rarity,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  name_en = EXCLUDED.name_en,
  description_en = EXCLUDED.description_en,
  price = EXCLUDED.price,
  "premiumOnly" = EXCLUDED."premiumOnly",
  active = TRUE,
  "visualPreset" = EXCLUDED."visualPreset",
  "updatedAt" = now();

-- If a random/test row used the same visual recipe as one of the official
-- cosmetics, transfer ownership to the official item before deleting it.
INSERT INTO "UserCosmetic" ("user_id","cosmetic_id",source,"acquired_at")
SELECT
  ownership."user_id",
  official.id,
  ownership.source,
  ownership."acquired_at"
FROM "UserCosmetic" ownership
JOIN "Cosmetic" legacy ON legacy.id = ownership."cosmetic_id"
JOIN "_TflOfficialCosmetics" spec
  ON spec.type = legacy.type::text
 AND spec.visual_preset = legacy."visualPreset"::text
JOIN "Cosmetic" official ON official.slug = spec.slug
WHERE NOT EXISTS (
  SELECT 1 FROM "_TflOfficialCosmetics" canonical WHERE canonical.slug = legacy.slug
)
ON CONFLICT ("user_id","cosmetic_id") DO NOTHING;

-- Preserve the equipped choice when the old row maps to a canonical preset.
UPDATE "EquippedCosmetic" equipped
SET
  "cosmetic_id" = official.id,
  "updated_at" = now()
FROM "Cosmetic" legacy, "_TflOfficialCosmetics" spec, "Cosmetic" official
WHERE equipped."cosmetic_id" = legacy.id
  AND spec.type = legacy.type::text
  AND spec.visual_preset = legacy."visualPreset"::text
  AND official.slug = spec.slug
  AND NOT EXISTS (
    SELECT 1 FROM "_TflOfficialCosmetics" canonical WHERE canonical.slug = legacy.slug
  );

-- Any canonical row that changed type while it was equipped is safer to
-- unequip than to keep an inconsistent user/type relation.
DELETE FROM "EquippedCosmetic" equipped
USING "Cosmetic" cosmetic
WHERE equipped."cosmetic_id" = cosmetic.id
  AND equipped.type <> cosmetic.type;

-- Purge all leftover admin/test/random cosmetics. Cascades clean unmatched
-- pre-production ownership/equipment; matching ownership was transferred above.
DELETE FROM "Cosmetic" cosmetic
WHERE NOT EXISTS (
  SELECT 1 FROM "_TflOfficialCosmetics" canonical WHERE canonical.slug = cosmetic.slug
);

-- Final defensive normalization: every official cosmetic is active, has a
-- positive TFL Coin price, localized copy, and exactly one safe preset.
UPDATE "Cosmetic" cosmetic
SET active = TRUE, "updatedAt" = now()
WHERE EXISTS (
  SELECT 1 FROM "_TflOfficialCosmetics" canonical WHERE canonical.slug = cosmetic.slug
);
