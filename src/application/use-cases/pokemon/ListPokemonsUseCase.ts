import { Pokemon } from '@domain/entities/Pokemon';
import { IPokemonRepository, PokemonFilter } from '@domain/repositories/IPokemonRepository';
import { Paginated, PaginationParams } from '@domain/repositories/Pagination';

export class ListPokemonsUseCase {
  constructor(private readonly pokemonRepository: IPokemonRepository) {}

  async execute(filter: PokemonFilter, pagination: PaginationParams): Promise<Paginated<Pokemon>> {
    return this.pokemonRepository.findAll(filter, pagination);
  }
}
