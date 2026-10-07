import { IPokeApiGateway } from '@domain/gateways/IPokeApiGateway';

import { PokeApiGateway } from '@infrastructure/providers/PokeApiGateway';

import { env } from '@main/config/env';

export function makePokeApiGateway(): IPokeApiGateway {
  return new PokeApiGateway(env.pokeApiBaseUrl);
}
