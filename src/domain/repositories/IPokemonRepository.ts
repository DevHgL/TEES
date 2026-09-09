import { Pokemon, PokemonBaseStats } from '@domain/entities/Pokemon';

export interface PokemonFilter {
  type?: string;
}

export interface CreatePokemonData {
  name: string;
  types: string[];
  baseStats: PokemonBaseStats;
  imageUrl?: string;
}

export type UpdatePokemonData = Partial<CreatePokemonData>;

export interface IPokemonRepository {
  findAll(filter?: PokemonFilter): Promise<Pokemon[]>;
  findById(id: string): Promise<Pokemon | null>;
  create(data: CreatePokemonData): Promise<Pokemon>;
  update(id: string, data: UpdatePokemonData): Promise<Pokemon | null>;
  delete(id: string): Promise<boolean>;
}
