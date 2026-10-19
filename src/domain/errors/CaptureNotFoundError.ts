import { AppError } from '@domain/errors/AppError';

export class CaptureNotFoundError extends AppError {
  constructor(id: string) {
    super(`Captura com id "${id}" não foi encontrada.`, 404);
  }
}
