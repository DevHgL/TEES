import { AppError } from '@domain/errors/AppError';

export class UnauthorizedError extends AppError {
  constructor(message = 'Autenticação necessária.') {
    super(message, 401);
  }
}
