import { AppError } from '@domain/errors/AppError';

export class TrainerEmailAlreadyInUseError extends AppError {
  constructor(email: string) {
    super(`Já existe um treinador cadastrado com o e-mail "${email}".`, 409);
  }
}
