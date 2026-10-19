import { AppError } from '@domain/errors/AppError';

/** Mensagem genérica de propósito: não revela se o e-mail existe (evita enumeração). */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super('E-mail ou senha inválidos.', 401);
  }
}
