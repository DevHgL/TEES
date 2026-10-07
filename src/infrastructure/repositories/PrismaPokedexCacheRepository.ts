import { PokedexEntry } from '@domain/gateways/IPokeApiGateway';
import {
  CachedPokedexEntry,
  IPokedexCacheRepository,
} from '@domain/repositories/IPokedexCacheRepository';

import { PrismaClient } from '@infrastructure/database/generated/prisma/client';

export class PrismaPokedexCacheRepository implements IPokedexCacheRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async find(lookupKey: string): Promise<CachedPokedexEntry | null> {
    const record = await this.prisma.pokedexCacheEntry.findUnique({ where: { lookupKey } });

    if (!record) {
      return null;
    }

    return {
      entry: {
        pokedexNumber: record.pokedexNumber,
        name: record.name,
        types: record.types,
        baseStats: {
          hp: record.hp,
          attack: record.attack,
          defense: record.defense,
          specialAttack: record.specialAttack,
          specialDefense: record.specialDefense,
          speed: record.speed,
        },
        imageUrl: record.imageUrl ?? undefined,
        height: record.height,
        weight: record.weight,
      },
      cachedAt: record.cachedAt,
    };
  }

  async save(lookupKey: string, entry: PokedexEntry): Promise<void> {
    const data = {
      pokedexNumber: entry.pokedexNumber,
      name: entry.name,
      types: entry.types,
      ...entry.baseStats,
      imageUrl: entry.imageUrl ?? null,
      height: entry.height,
      weight: entry.weight,
      cachedAt: new Date(),
    };

    // upsert: renova entradas expiradas e tolera duas requisições salvando a mesma chave.
    await this.prisma.pokedexCacheEntry.upsert({
      where: { lookupKey },
      create: { lookupKey, ...data },
      update: data,
    });
  }
}
