import { Pokemon } from '@domain/entities/Pokemon';
import { CreatePokemonData, IPokemonRepository } from '@domain/repositories/IPokemonRepository';

export class CreatePokemonUseCase {
  constructor(private readonly pokemonRepository: IPokemonRepository) {}

  async execute(data: CreatePokemonData): Promise<Pokemon> {
    return this.pokemonRepository.create(data);
  }
}
