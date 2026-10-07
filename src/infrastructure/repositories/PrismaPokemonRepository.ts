import { Pokemon } from '@domain/entities/Pokemon';
import {
  CreatePokemonData,
  IPokemonRepository,
  PokemonFilter,
  UpdatePokemonData,
} from '@domain/repositories/IPokemonRepository';
import { Paginated, PaginationParams } from '@domain/repositories/Pagination';

import { isRecordNotFoundError } from '@infrastructure/database/prismaErrors';
import {
  Prisma,
  PrismaClient,
  Pokemon as PokemonRecord,
} from '@infrastructure/database/generated/prisma/client';

export class PrismaPokemonRepository implements IPokemonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(
    filter: PokemonFilter,
    { page, limit }: PaginationParams,
  ): Promise<Paginated<Pokemon>> {
    const where: Prisma.PokemonWhereInput = {
      ...(filter.type && { types: { has: filter.type.toLowerCase() } }),
      ...(filter.name && { name: { contains: filter.name, mode: 'insensitive' } }),
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.pokemon.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pokemon.count({ where }),
    ]);

    return {
      data: records.map(toDomain),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
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
