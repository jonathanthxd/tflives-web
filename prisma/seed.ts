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

  // The official production cosmetic catalogue is migration-managed.
  // Keeping it out of the development seed prevents stale/random test names,
  // prices, or presets from being reintroduced after the production cleanup.

  console.log("✅ Seed completado: modalidades de desarrollo creadas; cosméticos gestionados por migraciones");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
