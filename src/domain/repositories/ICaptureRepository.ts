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
  create(data: CreateCaptureData): Promise<Capture>;
  findByTrainerId(trainerId: string): Promise<Capture[]>;
  countByTrainerId(trainerId: string): Promise<number>;
}
