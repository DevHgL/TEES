import { IPasswordHasher } from '@application/ports/IPasswordHasher';
import { Trainer } from '@domain/entities/Trainer';
import { TrainerEmailAlreadyInUseError } from '@domain/errors/TrainerEmailAlreadyInUseError';
import { ITrainerRepository } from '@domain/repositories/ITrainerRepository';

export interface CreateTrainerInput {
  name: string;
  email: string;
  password: string;
}

/** Cadastro de treinador: sempre com papel TRAINER e senha guardada só como hash. */
export class CreateTrainerUseCase {
  constructor(
    private readonly trainerRepository: ITrainerRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute({ name, email, password }: CreateTrainerInput): Promise<Trainer> {
    const existing = await this.trainerRepository.findByEmail(email);

    if (existing) {
      throw new TrainerEmailAlreadyInUseError(email);
    }

    const passwordHash = await this.passwordHasher.hash(password);

    return this.trainerRepository.create({ name, email, passwordHash, role: 'TRAINER' });
  }
}
