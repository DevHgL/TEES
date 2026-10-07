import { PokemonBaseStats } from '@domain/entities/Pokemon';

export interface CaptureProps {
  id: string;
  trainerId: string;
  pokedexNumber: number;
  name: string;
  nickname?: string;
  types: string[];
  baseStats: PokemonBaseStats;
  imageUrl?: string;
  capturedAt: Date;
}

/** Pokémon capturado por um treinador, com os dados oficiais da PokéAPI. */
export class Capture {
  readonly id: string;
  readonly trainerId: string;
  readonly pokedexNumber: number;
  readonly name: string;
  nickname?: string;
  readonly types: string[];
  readonly baseStats: PokemonBaseStats;
  readonly imageUrl?: string;
  readonly capturedAt: Date;

  constructor(props: CaptureProps) {
    this.id = props.id;
    this.trainerId = props.trainerId;
    this.pokedexNumber = props.pokedexNumber;
    this.name = props.name;
    this.nickname = props.nickname;
    this.types = props.types;
    this.baseStats = props.baseStats;
    this.imageUrl = props.imageUrl;
    this.capturedAt = props.capturedAt;
  }
}
