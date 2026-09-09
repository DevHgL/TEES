import { PokemonNotFoundError } from '@domain/errors/PokemonNotFoundError';
import { IPokemonRepository } from '@domain/repositories/IPokemonRepository';

export class DeletePokemonUseCase {
  constructor(private readonly pokemonRepository: IPokemonRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.pokemonRepository.delete(id);

    if (!deleted) {
      throw new PokemonNotFoundError(id);
    }
  }
}
