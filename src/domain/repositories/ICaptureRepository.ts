import { Capture } from '@domain/entities/Capture';
import { PokemonBaseStats } from '@domain/entities/Pokemon';

export interface CreateCaptureData {
  trainerId: string;
  pokedexNumber: number;
  name: string;
  nickname?: string;
  types: string[];
  baseStats: PokemonBaseStats;
  imageUrl?: string;
}

export interface ICaptureRepository {
  /**
   * Grava a captura somente se o treinador tiver menos de `maxTeamSize` Pokémons.
   * A checagem e a gravação são atômicas; retorna `null` quando o time está cheio.
   */
  createWithinTeamLimit(data: CreateCaptureData, maxTeamSize: number): Promise<Capture | null>;
  findByTrainerId(trainerId: string): Promise<Capture[]>;
  countByTrainerId(trainerId: string): Promise<number>;
}
