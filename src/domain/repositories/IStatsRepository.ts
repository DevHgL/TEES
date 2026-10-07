export interface StatsTotals {
  trainers: number;
  captures: number;
  catalogPokemons: number;
  cachedPokedexEntries: number;
  /** Média de Pokémons por time, considerando também treinadores sem capturas. */
  averageTeamSize: number;
}

export interface MostCapturedPokemon {
  pokedexNumber: number;
  name: string;
  imageUrl?: string;
  timesCaptured: number;
}

export interface CapturesByType {
  type: string;
  count: number;
}

export interface TrainerRanking {
  id: string;
  name: string;
  teamSize: number;
  /** Soma dos atributos base de todos os Pokémons do time. */
  totalBaseStats: number;
}

export interface Stats {
  totals: StatsTotals;
  mostCaptured: MostCapturedPokemon[];
  capturesByType: CapturesByType[];
  topTrainers: TrainerRanking[];
}

export interface IStatsRepository {
  getStats(limit: number): Promise<Stats>;
}
