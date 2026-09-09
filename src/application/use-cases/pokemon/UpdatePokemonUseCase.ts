import { Pokemon } from '@domain/entities/Pokemon';
import { PokemonNotFoundError } from '@domain/errors/PokemonNotFoundError';
import { IPokemonRepository, UpdatePokemonData } from '@domain/repositories/IPokemonRepository';

export class UpdatePokemonUseCase {
  constructor(private readonly pokemonRepository: IPokemonRepository) {}

  async execute(id: string, data: UpdatePokemonData): Promise<Pokemon> {
    const pokemon = await this.pokemonRepository.update(id, data);

    if (!pokemon) {
      throw new PokemonNotFoundError(id);
    }

    return pokemon;
  }
}
