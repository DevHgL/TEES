import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/infrastructure/database/generated/prisma/client';
import { pokemonSeed } from '../src/infrastructure/repositories/pokemonSeed';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

async function main(): Promise<void> {
  if ((await prisma.pokemon.count()) > 0) {
    console.log('Catálogo já populado — seed ignorado.');
    return;
  }

  await prisma.pokemon.createMany({
    data: pokemonSeed.map(({ name, types, baseStats, imageUrl }) => ({
      name,
      types,
      ...baseStats,
      imageUrl,
    })),
  });

  console.log(`Seed concluído: ${pokemonSeed.length} Pokémons inseridos no catálogo.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
