import { PokemonBaseStats } from '@domain/entities/Pokemon';

/** Dados oficiais de uma espécie, já normalizados a partir da PokéAPI. */
export interface PokedexEntry {
  pokedexNumber: number;
  name: string;
  types: string[];
  baseStats: PokemonBaseStats;
  imageUrl?: string;
  /** Altura em metros. */
  height: number;
  /** Peso em quilogramas. */
  weight: number;
}

export interface IPokeApiGateway {
  /** Retorna `null` quando a espécie não existe na PokéAPI. */
  findByName(name: string): Promise<PokedexEntry | null>;
}
