import { Trainer } from '@domain/entities/Trainer';
import { TrainerEmailAlreadyInUseError } from '@domain/errors/TrainerEmailAlreadyInUseError';
import { CreateTrainerData, ITrainerRepository } from '@domain/repositories/ITrainerRepository';

export class CreateTrainerUseCase {
  constructor(private readonly trainerRepository: ITrainerRepository) {}

  async execute(data: CreateTrainerData): Promise<Trainer> {
    const existing = await this.trainerRepository.findByEmail(data.email);

    if (existing) {
      throw new TrainerEmailAlreadyInUseError(data.email);
    }

    return this.trainerRepository.create(data);
  }
}
