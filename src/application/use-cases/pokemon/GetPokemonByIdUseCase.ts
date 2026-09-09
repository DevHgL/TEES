import { Pokemon } from '@domain/entities/Pokemon';
import { PokemonNotFoundError } from '@domain/errors/PokemonNotFoundError';
import { IPokemonRepository } from '@domain/repositories/IPokemonRepository';

export class GetPokemonByIdUseCase {
  constructor(private readonly pokemonRepository: IPokemonRepository) {}

  async execute(id: string): Promise<Pokemon> {
    const pokemon = await this.pokemonRepository.findById(id);

    if (!pokemon) {
      throw new PokemonNotFoundError(id);
    }

    return pokemon;
  }
}
