import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

import { PokedexEntry } from '../src/domain/gateways/IPokeApiGateway';
import { PrismaClient } from '../src/infrastructure/database/generated/prisma/client';
import { PokeApiGateway } from '../src/infrastructure/providers/PokeApiGateway';
import { pokemonSeed } from '../src/infrastructure/repositories/pokemonSeed';

/** Quantos Pokémons importar da PokéAPI (padrão: os 151 da 1ª geração). */
const SEED_LIMIT = Number(process.env['SEED_POKEMON_LIMIT']) || 151;
const BATCH_SIZE = 20;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

interface SeedPokemon {
  name: string;
  types: string[];
  baseStats: PokedexEntry['baseStats'];
  imageUrl?: string;
}

const capitalize = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1);

/** Busca os Pokémons 1..SEED_LIMIT na PokéAPI, em lotes para não sobrecarregar a API. */
async function fetchFromPokeApi(): Promise<SeedPokemon[]> {
  const gateway = new PokeApiGateway(
    process.env['POKEAPI_BASE_URL'] || 'https://pokeapi.co/api/v2',
    15000,
  );
  const result: SeedPokemon[] = [];

  for (let start = 1; start <= SEED_LIMIT; start += BATCH_SIZE) {
    const numbers = Array.from(
      { length: Math.min(BATCH_SIZE, SEED_LIMIT - start + 1) },
      (_, i) => start + i,
    );
    const entries = await Promise.all(numbers.map((n) => gateway.findByName(String(n))));

    for (const entry of entries) {
      if (entry) {
        result.push({
          name: capitalize(entry.name),
          types: entry.types,
          baseStats: entry.baseStats,
          imageUrl: entry.imageUrl,
        });
      }
    }

    console.log(`  ${result.length}/${SEED_LIMIT} Pokémons obtidos da PokéAPI...`);
  }

  return result;
}

async function seedCatalog(): Promise<void> {
  let pokemons: SeedPokemon[];

  try {
    console.log(`Importando ${SEED_LIMIT} Pokémons da PokéAPI...`);
    pokemons = await fetchFromPokeApi();
  } catch (err) {
    console.warn('PokéAPI indisponível; usando o seed local de 3 Pokémons.', err);
    pokemons = pokemonSeed;
  }

  // Idempotente: só insere quem ainda não está no catálogo (comparando pelo nome).
  const existing = await prisma.pokemon.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((p) => p.name.toLowerCase()));
  const missing = pokemons.filter((p) => !existingNames.has(p.name.toLowerCase()));

  if (missing.length === 0) {
    console.log('Catálogo já está completo — nada a inserir.');
    return;
  }

  // createdAt sequencial preserva a ordem da Pokédex na listagem do catálogo.
  const now = Date.now();
  await prisma.pokemon.createMany({
    data: missing.map(({ name, types, baseStats, imageUrl }, i) => ({
      name,
      types,
      ...baseStats,
      imageUrl,
      createdAt: new Date(now + i),
    })),
  });

  console.log(`Seed concluído: ${missing.length} Pokémons inseridos no catálogo.`);
}

/**
 * Contas de demonstração, uma por papel, todas com a senha SEED_DEMO_PASSWORD.
 * Só roda quando essa variável existe — em produção, não defina SEED_DEMO_PASSWORD.
 */
async function seedDemoAccounts(): Promise<void> {
  const password = process.env['SEED_DEMO_PASSWORD'];

  if (!password) {
    console.log('SEED_DEMO_PASSWORD não definida — contas de demonstração ignoradas.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, Number(process.env['BCRYPT_ROUNDS']) || 10);
  const accounts = [
    {
      name: 'Professor Carvalho',
      email: process.env['SEED_ADMIN_EMAIL'] || 'admin@pokemanager.dev',
      role: 'ADMIN' as const,
    },
    { name: 'Brock', email: 'brock@pokemanager.dev', role: 'GYM_LEADER' as const },
    { name: 'Red', email: 'red@pokemanager.dev', role: 'TRAINER' as const },
  ];

  for (const account of accounts) {
    // Idempotente: não sobrescreve uma conta que já exista.
    await prisma.trainer.upsert({
      where: { email: account.email },
      create: { ...account, passwordHash },
      update: {},
    });
  }

  console.log(
    `Contas de demonstração: ${accounts.map((a) => `${a.email} (${a.role})`).join(', ')}.`,
  );
}

async function main(): Promise<void> {
  await seedCatalog();
  await seedDemoAccounts();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
