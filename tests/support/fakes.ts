import { IPasswordHasher } from '@application/ports/IPasswordHasher';
import { AccessTokenPayload, ITokenService } from '@application/ports/ITokenService';
import { IPokeApiGateway, PokedexEntry } from '@domain/gateways/IPokeApiGateway';

/** Constrói uma entrada da Pokédex com atributos fixos. */
export function makePokedexEntry(name: string, pokedexNumber = 25): PokedexEntry {
  return {
    pokedexNumber,
    name,
    types: ['electric'],
    baseStats: {
      hp: 35,
      attack: 55,
      defense: 40,
      specialAttack: 50,
      specialDefense: 50,
      speed: 90,
    },
    imageUrl: `https://img.test/${name}.png`,
    height: 0.4,
    weight: 6,
  };
}

/** PokéAPI falsa: conhece só os nomes informados e conta as consultas feitas. */
export class FakePokeApiGateway implements IPokeApiGateway {
  calls = 0;

  constructor(private readonly known: string[] = ['pikachu']) {}

  async findByName(name: string): Promise<PokedexEntry | null> {
    this.calls++;
    const index = this.known.indexOf(name.toLowerCase());
    return index === -1 ? null : makePokedexEntry(name.toLowerCase(), index + 1);
  }
}

/** "Hash" reversível e rápido, suficiente para testar as regras sem o custo do bcrypt. */
export class FakePasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}

export class FakeTokenService implements ITokenService {
  readonly accessTokenTtlSeconds = 900;
  readonly refreshTokenTtlMs = 7 * 24 * 60 * 60 * 1000;
  private counter = 0;

  generateAccessToken({ trainerId, role }: AccessTokenPayload): string {
    return `access:${trainerId}:${role}`;
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    const [kind, trainerId, role] = token.split(':');
    return kind === 'access' && trainerId && role
      ? { trainerId, role: role as AccessTokenPayload['role'] }
      : null;
  }

  generateRefreshToken(): string {
    return `refresh-${++this.counter}`;
  }

  hashRefreshToken(token: string): string {
    return `sha:${token}`;
  }
}
