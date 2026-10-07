import { randomUUID } from 'node:crypto';

import { Pokemon } from '@domain/entities/Pokemon';
import {
  CreatePokemonData,
  IPokemonRepository,
  PokemonFilter,
  UpdatePokemonData,
} from '@domain/repositories/IPokemonRepository';
import { Paginated, PaginationParams } from '@domain/repositories/Pagination';

export class InMemoryPokemonRepository implements IPokemonRepository {
  private readonly pokemons = new Map<string, Pokemon>();

  constructor(seed: Pokemon[] = []) {
    for (const pokemon of seed) {
      this.pokemons.set(pokemon.id, pokemon);
    }
  }

  async findAll(
    filter: PokemonFilter,
    { page, limit }: PaginationParams,
  ): Promise<Paginated<Pokemon>> {
    const type = filter.type?.toLowerCase();
    const name = filter.name?.toLowerCase();

    const matches = Array.from(this.pokemons.values()).filter(
      (pokemon) =>
        (!type || pokemon.types.some((t) => t.toLowerCase() === type)) &&
        (!name || pokemon.name.toLowerCase().includes(name)),
    );

    return {
      data: matches.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: matches.length,
      totalPages: Math.ceil(matches.length / limit),
    };
  }

  async findById(id: string): Promise<Pokemon | null> {
    return this.pokemons.get(id) ?? null;
  }

  async create(data: CreatePokemonData): Promise<Pokemon> {
    const pokemon = new Pokemon({ id: randomUUID(), ...data });
    this.pokemons.set(pokemon.id, pokemon);
    return pokemon;
  }

  async update(id: string, data: UpdatePokemonData): Promise<Pokemon | null> {
    const existing = this.pokemons.get(id);

    if (!existing) {
      return null;
    }

    const updated = new Pokemon({
      id: existing.id,
      name: data.name ?? existing.name,
      types: data.types ?? existing.types,
      baseStats: data.baseStats ?? existing.baseStats,
      imageUrl: data.imageUrl ?? existing.imageUrl,
    });

    this.pokemons.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.pokemons.delete(id);
  }
}
