import { PokedexEntryNotFoundError } from '@domain/errors/PokedexEntryNotFoundError';
import { IPokeApiGateway, PokedexEntry } from '@domain/gateways/IPokeApiGateway';

export class SearchPokedexUseCase {
  constructor(private readonly pokeApiGateway: IPokeApiGateway) {}

  async execute(name: string): Promise<PokedexEntry> {
    const entry = await this.pokeApiGateway.findByName(name);

    if (!entry) {
      throw new PokedexEntryNotFoundError(name);
    }

    return entry;
  }
}
