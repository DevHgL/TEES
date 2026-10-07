import { SearchPokedexUseCase } from '@application/use-cases/pokedex/SearchPokedexUseCase';

import { PokedexController } from '@infrastructure/http/controllers/PokedexController';

import { makePokeApiGateway } from '@main/factories/pokeApiGateway.factory';

export function makePokedexController(): PokedexController {
  return new PokedexController(new SearchPokedexUseCase(makePokeApiGateway()));
}
