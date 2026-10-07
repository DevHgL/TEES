import { IPokeApiGateway, PokedexEntry } from '@domain/gateways/IPokeApiGateway';
import { IPokedexCacheRepository } from '@domain/repositories/IPokedexCacheRepository';

/**
 * Decorator sobre um IPokeApiGateway: consulta primeiro o cache persistido e só chama a
 * PokéAPI quando a entrada não existe ou expirou. Falhas do cache nunca derrubam a consulta.
 */
export class CachedPokeApiGateway implements IPokeApiGateway {
  constructor(
    private readonly gateway: IPokeApiGateway,
    private readonly cache: IPokedexCacheRepository,
    private readonly ttlMs: number,
  ) {}

  async findByName(name: string): Promise<PokedexEntry | null> {
    const key = name.toLowerCase();

    const cached = await this.cache.find(key).catch((err) => {
      console.warn('Falha ao ler o cache da Pokédex:', err);
      return null;
    });

    if (cached && Date.now() - cached.cachedAt.getTime() < this.ttlMs) {
      return cached.entry;
    }

    const entry = await this.gateway.findByName(key);

    if (entry) {
      await this.cache.save(key, entry).catch((err) => {
        console.warn('Falha ao gravar o cache da Pokédex:', err);
      });
    }

    return entry;
  }
}
