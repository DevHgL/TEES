import { Trainer } from '@domain/entities/Trainer';
import { ITrainerRepository } from '@domain/repositories/ITrainerRepository';

export class ListTrainersUseCase {
  constructor(private readonly trainerRepository: ITrainerRepository) {}

  async execute(): Promise<Trainer[]> {
    return this.trainerRepository.findAll();
  }
}
