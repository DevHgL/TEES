import { CaptureNotFoundError } from '@domain/errors/CaptureNotFoundError';
import { ForbiddenError } from '@domain/errors/ForbiddenError';
import { ICaptureRepository } from '@domain/repositories/ICaptureRepository';

export interface ReleasePokemonInput {
  /** Treinador autenticado (extraído do token). */
  trainerId: string;
  captureId: string;
}

/** Solta um Pokémon do time. Só o dono da captura pode soltá-lo. */
export class ReleasePokemonUseCase {
  constructor(private readonly captureRepository: ICaptureRepository) {}

  async execute({ trainerId, captureId }: ReleasePokemonInput): Promise<void> {
    const capture = await this.captureRepository.findById(captureId);

    if (!capture) {
      throw new CaptureNotFoundError(captureId);
    }

    if (capture.trainerId !== trainerId) {
      throw new ForbiddenError('Só o dono do Pokémon pode soltá-lo.');
    }

    await this.captureRepository.delete(captureId);
  }
}
