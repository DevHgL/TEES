import { createServer, Server } from 'node:http';

/** Espécies que a PokéAPI falsa conhece, no formato de GET /pokemon/{name}. */
const SPECIES = ['pikachu', 'charmander', 'squirtle', 'bulbasaur', 'eevee', 'snorlax', 'mew'];

function speciesPayload(id: number, name: string): unknown {
  return {
    id,
    name,
    height: 4,
    weight: 60,
    types: [{ slot: 1, type: { name: 'electric' } }],
    stats: [
      ['hp', 35],
      ['attack', 55],
      ['defense', 40],
      ['special-attack', 50],
      ['special-defense', 50],
      ['speed', 90],
    ].map(([stat, value]) => ({ base_stat: value, stat: { name: stat } })),
    sprites: { front_default: `https://raw.githubusercontent.com/${name}.png`, other: {} },
  };
}

/** Sobe uma PokéAPI falsa: os testes E2E não dependem da internet nem da API real. */
export function startPokeApiStub(port: number): Promise<Server> {
  const server = createServer((req, res) => {
    const name = /^\/api\/v2\/pokemon\/([^/?]+)/.exec(req.url ?? '')?.[1];
    const index = name ? SPECIES.indexOf(decodeURIComponent(name)) : -1;

    if (!name || index === -1) {
      res.writeHead(404).end('Not Found');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(speciesPayload(index + 1, SPECIES[index]!)));
  });

  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}
