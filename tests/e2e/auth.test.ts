import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@main/config/database';

import { api, createSession, PASSWORD, refreshCookieFrom, resetDatabase } from './helpers';

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
    // O refresh token vai só no cookie httpOnly, nunca no JSON.
    expect(res.body).not.toHaveProperty('refreshToken');
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('pokemanager_refresh='),
    );
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    expect(cookie).toMatch(/Max-Age=\d+/);
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
  it('renova a sessão pelo cookie e troca o cookie (rotação)', async () => {
    const { refreshCookie } = await createSession('Ash');

    const res = await api().post('/api/v1/auth/refresh').set('Cookie', refreshCookie).expect(200);

    expect(res.body).toMatchObject({ tokenType: 'Bearer', accessToken: expect.any(String) });
    expect(res.body).not.toHaveProperty('refreshToken');
    expect(refreshCookieFrom(res)).not.toBe(refreshCookie);
  });

  it('reuso de cookie antigo encerra todas as sessões e apaga o cookie', async () => {
    const { refreshCookie } = await createSession('Ash');
    const first = await api().post('/api/v1/auth/refresh').set('Cookie', refreshCookie).expect(200);

    const reuse = await api().post('/api/v1/auth/refresh').set('Cookie', refreshCookie).expect(401);
    expect(String(reuse.headers['set-cookie'])).toMatch(
      /pokemanager_refresh=;.*Expires=Thu, 01 Jan 1970/,
    );

    // O reuso revogou todas as sessões, inclusive a nova.
    await api().post('/api/v1/auth/refresh').set('Cookie', refreshCookieFrom(first)).expect(401);
  });

  it('sem cookie dá 401, e um refreshToken no corpo é ignorado', async () => {
    await api().post('/api/v1/auth/refresh').expect(401);
    await api().post('/api/v1/auth/refresh').send({ refreshToken: 'qualquer' }).expect(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revoga o refresh token do cookie e apaga o cookie', async () => {
    const { refreshCookie } = await createSession('Ash');

    const res = await api().post('/api/v1/auth/logout').set('Cookie', refreshCookie).expect(204);
    expect(String(res.headers['set-cookie'])).toMatch(/pokemanager_refresh=;/);

    await api().post('/api/v1/auth/refresh').set('Cookie', refreshCookie).expect(401);
  });

  it('sem cookie também responde 204 (idempotente)', async () => {
    await api().post('/api/v1/auth/logout').expect(204);
  });
});
