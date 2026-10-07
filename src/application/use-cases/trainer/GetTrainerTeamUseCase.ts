import { Capture } from '@domain/entities/Capture';
import { TrainerNotFoundError } from '@domain/errors/TrainerNotFoundError';
import { ICaptureRepository } from '@domain/repositories/ICaptureRepository';
import { ITrainerRepository } from '@domain/repositories/ITrainerRepository';

export class GetTrainerTeamUseCase {
  constructor(
    private readonly trainerRepository: ITrainerRepository,
    private readonly captureRepository: ICaptureRepository,
  ) {}

  async execute(trainerId: string): Promise<Capture[]> {
    const trainer = await this.trainerRepository.findById(trainerId);

    if (!trainer) {
      throw new TrainerNotFoundError(trainerId);
    }

    return this.captureRepository.findByTrainerId(trainerId);
  }
}
