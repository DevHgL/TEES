import { Trainer } from '@domain/entities/Trainer';
import { ITrainerRepository, TrainerFilter } from '@domain/repositories/ITrainerRepository';
import { Paginated, PaginationParams } from '@domain/repositories/Pagination';

export class ListTrainersUseCase {
  constructor(private readonly trainerRepository: ITrainerRepository) {}

  async execute(filter: TrainerFilter, pagination: PaginationParams): Promise<Paginated<Trainer>> {
    return this.trainerRepository.findAll(filter, pagination);
  }
}
