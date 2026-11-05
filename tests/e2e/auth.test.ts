import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@main/config/database';

import { api, createSession, PASSWORD, resetDatabase } from './helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('POST /api/v1/auth/register', () => {
  it('cadastra o treinador sem devolver a senha nem o hash', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ name: 'Ash', email: 'ASH@Test.com', password: PASSWORD })
      .expect(201);

    expect(res.body).toMatchObject({ name: 'Ash', email: 'ash@test.com', role: 'TRAINER' });
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash|\$2[aby]\$/i);

    const stored = await prisma.trainer.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('valida o payload com Zod', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ name: '', email: 'invalido', password: '123' })
      .expect(400);

    expect(res.body.errors.map((e: { path: string }) => e.path)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
  });

  it('recusa e-mail duplicado', async () => {
    await createSession('Ash');
    await api()
      .post('/api/v1/auth/register')
      .send({ name: 'Ash 2', email: 'ash@test.com', password: PASSWORD })
      .expect(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('emite JWT Bearer e refresh token', async () => {
    await createSession('Ash');
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'ash@test.com', password: PASSWORD })
      .expect(200);

    expect(res.body).toMatchObject({ tokenType: 'Bearer', expiresIn: expect.any(Number) });
    expect(res.body.accessToken.split('.')).toHaveLength(3);
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it('senha errada e e-mail inexistente recebem a mesma resposta', async () => {
    await createSession('Ash');
    const wrong = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'ash@test.com', password: 'errada123' });
    const unknown = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'nao@existe.com', password: 'errada123' });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('rotaciona o refresh token e detecta reuso', async () => {
    const { refreshToken } = await createSession('Ash');

    const first = await api().post('/api/v1/auth/refresh').send({ refreshToken }).expect(200);
    expect(first.body.refreshToken).not.toBe(refreshToken);

    await api().post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
    // O reuso revogou todas as sessões, inclusive a nova.
    await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.body.refreshToken })
      .expect(401);
  });
});
