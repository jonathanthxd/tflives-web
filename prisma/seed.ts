import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const modalities = [
    { name: 'SurvivalRPG', description: 'Survival con elementos RPG', icon: 'sword' },
    { name: 'Skyblock', description: 'Skyblock competitivo', icon: 'cloud' },
    { name: 'Gens Tycoon', description: 'Generadores y economía', icon: 'coins' },
    { name: 'Vanilla 26.2', description: 'Experiencia vanilla pura', icon: 'box' },
    { name: 'CityBuild', description: 'Construye tu ciudad', icon: 'building' },
  ]

  for (const mod of modalities) {
    await prisma.modality.upsert({
      where: { name: mod.name },
      update: {},
      create: mod,
    })
  }

  console.log('✅ Seed completado: Modalidades creadas')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })