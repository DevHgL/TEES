import { AppError } from '@domain/errors/AppError';

export class PokemonNotFoundError extends AppError {
  constructor(id: string) {
    super(`Pokémon com id "${id}" não foi encontrado.`, 404);
  }
}
