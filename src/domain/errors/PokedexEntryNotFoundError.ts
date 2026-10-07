import { AppError } from '@domain/errors/AppError';

export class PokedexEntryNotFoundError extends AppError {
  constructor(name: string) {
    super(`Pokémon "${name}" não existe na Pokédex oficial.`, 404);
  }
}
