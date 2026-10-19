import { Trainer } from '@domain/entities/Trainer';
import { TrainerNotFoundError } from '@domain/errors/TrainerNotFoundError';
import { ITrainerRepository } from '@domain/repositories/ITrainerRepository';

export class GetTrainerByIdUseCase {
  constructor(private readonly trainerRepository: ITrainerRepository) {}

  async execute(id: string): Promise<Trainer> {
    const trainer = await this.trainerRepository.findById(id);

    if (!trainer) {
      throw new TrainerNotFoundError(id);
    }

    return trainer;
  }
}
