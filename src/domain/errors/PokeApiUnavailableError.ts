import { AppError } from '@domain/errors/AppError';

export class PokeApiUnavailableError extends AppError {
  constructor() {
    super('Não foi possível consultar a PokéAPI no momento. Tente novamente mais tarde.', 502);
  }
}
