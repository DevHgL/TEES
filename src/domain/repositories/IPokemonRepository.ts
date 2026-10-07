import { Pokemon, PokemonBaseStats } from '@domain/entities/Pokemon';
import { Paginated, PaginationParams } from '@domain/repositories/Pagination';

export interface PokemonFilter {
  type?: string;
  /** Busca parcial, sem diferenciar maiúsculas/minúsculas. */
  name?: string;
}

export interface CreatePokemonData {
  name: string;
  types: string[];
  baseStats: PokemonBaseStats;
  imageUrl?: string;
}

export type UpdatePokemonData = Partial<CreatePokemonData>;

export interface IPokemonRepository {
  findAll(filter: PokemonFilter, pagination: PaginationParams): Promise<Paginated<Pokemon>>;
  findById(id: string): Promise<Pokemon | null>;
  create(data: CreatePokemonData): Promise<Pokemon>;
  update(id: string, data: UpdatePokemonData): Promise<Pokemon | null>;
  delete(id: string): Promise<boolean>;
}
