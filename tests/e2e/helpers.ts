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
  refreshToken: string;
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

  const { body } = await api()
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return { id: trainer.id, accessToken: body.accessToken, refreshToken: body.refreshToken };
}

export const bearer = (session: Session): [string, string] => [
  'Authorization',
  `Bearer ${session.accessToken}`,
];
