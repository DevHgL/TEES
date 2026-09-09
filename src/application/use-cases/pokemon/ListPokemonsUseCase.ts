import { Pokemon } from '@domain/entities/Pokemon';
import { IPokemonRepository, PokemonFilter } from '@domain/repositories/IPokemonRepository';

export class ListPokemonsUseCase {
  constructor(private readonly pokemonRepository: IPokemonRepository) {}

  async execute(filter?: PokemonFilter): Promise<Pokemon[]> {
    return this.pokemonRepository.findAll(filter);
  }
}
