import { Capture } from '@domain/entities/Capture';
import { Trainer } from '@domain/entities/Trainer';
import { PokedexEntryNotFoundError } from '@domain/errors/PokedexEntryNotFoundError';
import { TeamFullError } from '@domain/errors/TeamFullError';
import { TrainerNotFoundError } from '@domain/errors/TrainerNotFoundError';
import { IPokeApiGateway } from '@domain/gateways/IPokeApiGateway';
import { ICaptureRepository } from '@domain/repositories/ICaptureRepository';
import { ITrainerRepository } from '@domain/repositories/ITrainerRepository';

export interface CapturePokemonInput {
  trainerId: string;
  pokemonName: string;
  nickname?: string;
}

export class CapturePokemonUseCase {
  constructor(
    private readonly trainerRepository: ITrainerRepository,
    private readonly captureRepository: ICaptureRepository,
    private readonly pokeApiGateway: IPokeApiGateway,
  ) {}

  async execute({ trainerId, pokemonName, nickname }: CapturePokemonInput): Promise<Capture> {
    const trainer = await this.trainerRepository.findById(trainerId);

    if (!trainer) {
      throw new TrainerNotFoundError(trainerId);
    }

    // Valida a regra antes de consultar a PokéAPI para evitar chamadas externas desnecessárias.
    const teamSize = await this.captureRepository.countByTrainerId(trainerId);

    if (teamSize >= Trainer.MAX_TEAM_SIZE) {
      throw new TeamFullError();
    }

    const entry = await this.pokeApiGateway.findByName(pokemonName);

    if (!entry) {
      throw new PokedexEntryNotFoundError(pokemonName);
    }

    return this.captureRepository.create({
      trainerId,
      pokedexNumber: entry.pokedexNumber,
      name: entry.name,
      nickname,
      types: entry.types,
      baseStats: entry.baseStats,
      imageUrl: entry.imageUrl,
    });
  }
}
