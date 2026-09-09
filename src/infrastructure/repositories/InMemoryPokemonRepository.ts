import { randomUUID } from 'node:crypto';

import { Pokemon } from '@domain/entities/Pokemon';
import {
  CreatePokemonData,
  IPokemonRepository,
  PokemonFilter,
  UpdatePokemonData,
} from '@domain/repositories/IPokemonRepository';

export class InMemoryPokemonRepository implements IPokemonRepository {
  private readonly pokemons = new Map<string, Pokemon>();

  constructor(seed: Pokemon[] = []) {
    for (const pokemon of seed) {
      this.pokemons.set(pokemon.id, pokemon);
    }
  }

  async findAll(filter?: PokemonFilter): Promise<Pokemon[]> {
    const all = Array.from(this.pokemons.values());

    if (!filter?.type) {
      return all;
    }

    const type = filter.type.toLowerCase();
    return all.filter((pokemon) => pokemon.types.some((t) => t.toLowerCase() === type));
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
