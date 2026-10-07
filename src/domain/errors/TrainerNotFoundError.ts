import { AppError } from '@domain/errors/AppError';

export class TrainerNotFoundError extends AppError {
  constructor(id: string) {
    super(`Treinador com id "${id}" não foi encontrado.`, 404);
  }
}
