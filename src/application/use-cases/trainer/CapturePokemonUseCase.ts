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

    // Checagem antecipada: evita consultar a PokéAPI quando o time já está cheio.
    const teamSize = await this.captureRepository.countByTrainerId(trainerId);

    if (teamSize >= Trainer.MAX_TEAM_SIZE) {
      throw new TeamFullError();
    }

    const entry = await this.pokeApiGateway.findByName(pokemonName);

    if (!entry) {
      throw new PokedexEntryNotFoundError(pokemonName);
    }

    // A regra é revalidada de forma atômica na gravação, cobrindo capturas simultâneas.
    const capture = await this.captureRepository.createWithinTeamLimit(
      {
        trainerId,
        pokedexNumber: entry.pokedexNumber,
        name: entry.name,
        nickname,
        types: entry.types,
        baseStats: entry.baseStats,
        imageUrl: entry.imageUrl,
      },
      Trainer.MAX_TEAM_SIZE,
    );

    if (!capture) {
      throw new TeamFullError();
    }

    return capture;
  }
}
