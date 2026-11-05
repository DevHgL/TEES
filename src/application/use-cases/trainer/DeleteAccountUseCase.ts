import { IPasswordHasher } from '@application/ports/IPasswordHasher';
import { ForbiddenError } from '@domain/errors/ForbiddenError';
import { TrainerNotFoundError } from '@domain/errors/TrainerNotFoundError';
import { ITrainerRepository } from '@domain/repositories/ITrainerRepository';

export interface DeleteAccountInput {
  /** Treinador autenticado (extraído do token). */
  trainerId: string;
  /** Senha atual: ação irreversível exige reautenticação, não só um token válido. */
  password: string;
}

/**
 * O treinador apaga a própria conta; capturas e sessões vão junto (ON DELETE CASCADE).
 * O último ADMIN não pode se apagar, senão ninguém mais administra os perfis.
 */
export class DeleteAccountUseCase {
  constructor(
    private readonly trainerRepository: ITrainerRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute({ trainerId, password }: DeleteAccountInput): Promise<void> {
    const trainer = await this.trainerRepository.findById(trainerId);

    if (!trainer) {
      throw new TrainerNotFoundError(trainerId);
    }

    const passwordMatches =
      !!trainer.passwordHash && (await this.passwordHasher.compare(password, trainer.passwordHash));

    if (!passwordMatches) {
      throw new ForbiddenError('Senha incorreta.');
    }

    if (trainer.role === 'ADMIN' && (await this.trainerRepository.countByRole('ADMIN')) <= 1) {
      throw new ForbiddenError('O último ADMIN não pode apagar a própria conta.');
    }

    await this.trainerRepository.delete(trainerId);
  }
}
