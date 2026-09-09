export class PokemonNotFoundError extends Error {
  constructor(id: string) {
    super(`Pokémon com id "${id}" não foi encontrado.`);
    this.name = 'PokemonNotFoundError';
  }
}
