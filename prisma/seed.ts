import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Development seed is disabled in production");
  const modalities = [
    {
      name: "SurvivalRPG",
      description: "Survival con elementos RPG",
      icon: "sword",
    },
    { name: "Skyblock", description: "Skyblock competitivo", icon: "cloud" },
    {
      name: "Gens Tycoon",
      description: "Generadores y economía",
      icon: "coins",
    },
    {
      name: "Vanilla 26.2",
      description: "Experiencia vanilla pura",
      icon: "box",
    },
    { name: "CityBuild", description: "Construye tu ciudad", icon: "building" },
  ];

  for (const mod of modalities) {
    await prisma.modality.upsert({
      where: { name: mod.name },
      update: {},
      create: mod,
    });
  }

  const cosmetics = [
    { slug: "bronze-frame", type: "AVATAR_FRAME", rarity: "COMMON", name: "Marco Bronce", description: "Un marco cálido para tu avatar.", nameEn: "Bronze Frame", descriptionEn: "A warm frame for your avatar.", price: 50, premiumOnly: false, visualPreset: "BRONZE_FRAME" },
    { slug: "aurora-accent", type: "PROFILE_ACCENT", rarity: "RARE", name: "Acento Aurora", description: "Un brillo sereno para tu perfil.", nameEn: "Aurora Accent", descriptionEn: "A calm glow for your profile.", price: 80, premiumOnly: false, visualPreset: "AURORA_ACCENT" },
    { slug: "star-badge", type: "PROFILE_BADGE", rarity: "RARE", name: "Insignia Estrella", description: "Una estrella discreta junto a tu nombre.", nameEn: "Star Badge", descriptionEn: "A subtle star beside your name.", price: 100, premiumOnly: false, visualPreset: "STAR_BADGE" },
    { slug: "amber-accent", type: "PROFILE_ACCENT", rarity: "EPIC", name: "Acento Ámbar", description: "Un detalle luminoso para tu perfil.", nameEn: "Amber Accent", descriptionEn: "A bright profile detail.", price: 150, premiumOnly: false, visualPreset: "AMBER_ACCENT" },
    { slug: "violet-nameplate", type: "NAMEPLATE", rarity: "EPIC", name: "Placa Violeta", description: "Un nombre con presencia violeta.", nameEn: "Violet Nameplate", descriptionEn: "A name with violet presence.", price: 175, premiumOnly: false, visualPreset: "VIOLET_NAMEPLATE" },
    { slug: "sunset-banner", type: "BANNER_STYLE", rarity: "EPIC", name: "Banner Atardecer", description: "Una atmósfera cálida para tu cabecera.", nameEn: "Sunset Banner", descriptionEn: "A warm atmosphere for your header.", price: 225, premiumOnly: true, visualPreset: "SUNSET_BANNER" },
    { slug: "prism-frame", type: "AVATAR_FRAME", rarity: "LEGENDARY", name: "Marco Prisma", description: "Un marco vibrante reservado para Premium.", nameEn: "Prism Frame", descriptionEn: "A vibrant frame reserved for Premium.", price: 350, premiumOnly: true, visualPreset: "PRISM_FRAME" },
    { slug: "crown-badge", type: "PROFILE_BADGE", rarity: "LEGENDARY", name: "Insignia Corona", description: "Una corona pequeña para perfiles Premium.", nameEn: "Crown Badge", descriptionEn: "A small crown for Premium profiles.", price: 300, premiumOnly: true, visualPreset: "CROWN_BADGE" },
  ] as const;

  for (const cosmetic of cosmetics) {
    await prisma.cosmetic.upsert({
      where: { slug: cosmetic.slug },
      update: {},
      create: cosmetic,
    });
  }

  console.log("✅ Seed completado: Modalidades y cosméticos creados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
