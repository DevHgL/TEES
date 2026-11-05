import request from 'supertest';

import { Role } from '@domain/entities/Trainer';

import { createApp } from '@main/app';
import { prisma } from '@main/config/database';

export const app = createApp();
export const api = (): ReturnType<typeof request> => request(app);

export const PASSWORD = 'pikachu123';

/** Apaga todos os dados gerados pelos testes (o catálogo não é usado aqui). */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE captures, refresh_tokens, trainers, pokedex_cache, pokemons CASCADE',
  );
}

export interface Session {
  id: string;
  accessToken: string;
  /** Valor do cabeçalho Cookie com o refresh token (pokemanager_refresh=...). */
  refreshCookie: string;
}

/** Extrai o cookie do refresh token do Set-Cookie, pronto para o cabeçalho Cookie. */
export function refreshCookieFrom(res: { headers: Record<string, unknown> }): string {
  const setCookie = res.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? (setCookie as string[]) : [];
  const cookie = cookies.find((c) => c.startsWith('pokemanager_refresh='));

  if (!cookie) {
    throw new Error('A resposta não definiu o cookie pokemanager_refresh.');
  }

  return cookie.split(';')[0]!;
}

/** Cadastra um treinador (com o papel pedido) e faz login. */
export async function createSession(name: string, role: Role = 'TRAINER'): Promise<Session> {
  const email = `${name.toLowerCase()}@test.com`;
  const { body: trainer } = await api()
    .post('/api/v1/auth/register')
    .send({ name, email, password: PASSWORD })
    .expect(201);

  if (role !== 'TRAINER') {
    await prisma.trainer.update({ where: { id: trainer.id }, data: { role } });
  }

  const res = await api()
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return {
    id: trainer.id,
    accessToken: res.body.accessToken,
    refreshCookie: refreshCookieFrom(res),
  };
}

export const bearer = (session: Session): [string, string] => [
  'Authorization',
  `Bearer ${session.accessToken}`,
];
