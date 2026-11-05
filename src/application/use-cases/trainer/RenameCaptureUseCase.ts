import { Capture } from '@domain/entities/Capture';
import { CaptureNotFoundError } from '@domain/errors/CaptureNotFoundError';
import { ForbiddenError } from '@domain/errors/ForbiddenError';
import { ICaptureRepository } from '@domain/repositories/ICaptureRepository';

export interface RenameCaptureInput {
  /** Treinador autenticado (extraído do token). */
  trainerId: string;
  captureId: string;
  /** Novo apelido, ou `null` para voltar ao nome da espécie. */
  nickname: string | null;
}

/** Troca o apelido de um Pokémon do time. Só o dono da captura pode renomeá-lo. */
export class RenameCaptureUseCase {
  constructor(private readonly captureRepository: ICaptureRepository) {}

  async execute({ trainerId, captureId, nickname }: RenameCaptureInput): Promise<Capture> {
    const capture = await this.captureRepository.findById(captureId);

    if (!capture) {
      throw new CaptureNotFoundError(captureId);
    }

    if (capture.trainerId !== trainerId) {
      throw new ForbiddenError('Só o dono do Pokémon pode trocar o apelido.');
    }

    return this.captureRepository.updateNickname(captureId, nickname);
  }
}
