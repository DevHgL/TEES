import { IPokeApiGateway } from '@domain/gateways/IPokeApiGateway';

import { CachedPokeApiGateway } from '@infrastructure/providers/CachedPokeApiGateway';
import { PokeApiGateway } from '@infrastructure/providers/PokeApiGateway';
import { PrismaPokedexCacheRepository } from '@infrastructure/repositories/PrismaPokedexCacheRepository';

import { prisma } from '@main/config/database';
import { env } from '@main/config/env';

export function makePokeApiGateway(): IPokeApiGateway {
  return new CachedPokeApiGateway(
    new PokeApiGateway(env.pokeApiBaseUrl),
    new PrismaPokedexCacheRepository(prisma),
    env.pokedexCacheTtlHours * 60 * 60 * 1000,
  );
}
