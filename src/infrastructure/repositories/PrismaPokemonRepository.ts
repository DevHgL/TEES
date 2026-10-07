import { Pokemon } from '@domain/entities/Pokemon';
import {
  CreatePokemonData,
  IPokemonRepository,
  PokemonFilter,
  UpdatePokemonData,
} from '@domain/repositories/IPokemonRepository';

import { isRecordNotFoundError } from '@infrastructure/database/prismaErrors';
import {
  PrismaClient,
  Pokemon as PokemonRecord,
} from '@infrastructure/database/generated/prisma/client';

export class PrismaPokemonRepository implements IPokemonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(filter?: PokemonFilter): Promise<Pokemon[]> {
    const records = await this.prisma.pokemon.findMany({
      where: filter?.type ? { types: { has: filter.type.toLowerCase() } } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    return records.map(toDomain);
  }

  async findById(id: string): Promise<Pokemon | null> {
    const record = await this.prisma.pokemon.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async create(data: CreatePokemonData): Promise<Pokemon> {
    const record = await this.prisma.pokemon.create({
      data: {
        name: data.name,
        types: data.types,
        ...data.baseStats,
        imageUrl: data.imageUrl,
      },
    });

    return toDomain(record);
  }

  async update(id: string, data: UpdatePokemonData): Promise<Pokemon | null> {
    try {
      const record = await this.prisma.pokemon.update({
        where: { id },
        data: {
          name: data.name,
          types: data.types,
          ...data.baseStats,
          imageUrl: data.imageUrl,
        },
      });

      return toDomain(record);
    } catch (err) {
      if (isRecordNotFoundError(err)) {
        return null;
      }
      throw err;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.pokemon.delete({ where: { id } });
      return true;
    } catch (err) {
      if (isRecordNotFoundError(err)) {
        return false;
      }
      throw err;
    }
  }
}

function toDomain(record: PokemonRecord): Pokemon {
  return new Pokemon({
    id: record.id,
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
  });
}
