import { PokedexEntry } from '@domain/gateways/IPokeApiGateway';

export interface CachedPokedexEntry {
  entry: PokedexEntry;
  cachedAt: Date;
}

export interface IPokedexCacheRepository {
  find(lookupKey: string): Promise<CachedPokedexEntry | null>;
  save(lookupKey: string, entry: PokedexEntry): Promise<void>;
}
