import { z } from 'zod';

import { PokeApiUnavailableError } from '@domain/errors/PokeApiUnavailableError';
import { IPokeApiGateway, PokedexEntry } from '@domain/gateways/IPokeApiGateway';

/** Recorte do payload de GET /pokemon/{name} que a aplicação utiliza. */
const pokeApiPokemonSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  types: z.array(z.object({ slot: z.number(), type: z.object({ name: z.string() }) })),
  stats: z.array(z.object({ base_stat: z.number(), stat: z.object({ name: z.string() }) })),
  sprites: z.object({
    front_default: z.string().nullable(),
    other: z
      .object({
        'official-artwork': z.object({ front_default: z.string().nullable() }).optional(),
      })
      .optional(),
  }),
});

type PokeApiPokemon = z.infer<typeof pokeApiPokemonSchema>;

export class PokeApiGateway implements IPokeApiGateway {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = 5000,
  ) {}

  async findByName(name: string): Promise<PokedexEntry | null> {
    const url = `${this.baseUrl}/pokemon/${encodeURIComponent(name.toLowerCase())}`;

    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    } catch {
      throw new PokeApiUnavailableError();
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new PokeApiUnavailableError();
    }

    const parsed = pokeApiPokemonSchema.safeParse(await response.json().catch(() => null));

    if (!parsed.success) {
      throw new PokeApiUnavailableError();
    }

    return toPokedexEntry(parsed.data);
  }
}

function toPokedexEntry(data: PokeApiPokemon): PokedexEntry {
  const statOf = (statName: string): number =>
    data.stats.find((s) => s.stat.name === statName)?.base_stat ?? 0;

  return {
    pokedexNumber: data.id,
    name: data.name,
    types: [...data.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    baseStats: {
      hp: statOf('hp'),
      attack: statOf('attack'),
      defense: statOf('defense'),
      specialAttack: statOf('special-attack'),
      specialDefense: statOf('special-defense'),
      speed: statOf('speed'),
    },
    imageUrl:
      data.sprites.other?.['official-artwork']?.front_default ??
      data.sprites.front_default ??
      undefined,
    // A PokéAPI retorna altura em decímetros e peso em hectogramas.
    height: data.height / 10,
    weight: data.weight / 10,
  };
}
