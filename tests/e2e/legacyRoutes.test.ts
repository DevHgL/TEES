import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@main/config/database';

import { api, bearer, createSession, PASSWORD, resetDatabase } from './helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

/** Data de descontinuação (05/11/2026) no formato da RFC 9745. */
const DEPRECATION = '@1793836800';

describe('Rotas da Entrega 2 descontinuadas (continuam funcionando)', () => {
  it('POST /trainers cadastra como /auth/register e avisa a substituta', async () => {
    const res = await api()
      .post('/api/v1/trainers')
      .send({ name: 'Ash', email: 'ash@test.com', password: PASSWORD })
      .expect(201);

    expect(res.body).toMatchObject({ email: 'ash@test.com', role: 'TRAINER' });
    expect(res.headers['deprecation']).toBe(DEPRECATION);
    expect(res.headers['link']).toBe('</api/v1/auth/register>; rel="successor-version"');
  });

  it('POST /trainers/:id/captures captura para o próprio time e avisa a substituta', async () => {
    const ash = await createSession('Ash');

    const res = await api()
      .post(`/api/v1/trainers/${ash.id}/captures`)
      .set(...bearer(ash))
      .send({ pokemonName: 'pikachu' })
      .expect(201);

    expect(res.body).toMatchObject({ trainerId: ash.id, name: 'pikachu' });
    expect(res.headers['deprecation']).toBe(DEPRECATION);
    expect(res.headers['link']).toBe('</api/v1/me/team/catch>; rel="successor-version"');
  });

  it('POST /trainers/:id/captures: só o dono ou um ADMIN capturam para o time', async () => {
    const ash = await createSession('Ash');
    const gary = await createSession('Gary');
    const admin = await createSession('Admin', 'ADMIN');

    await api()
      .post(`/api/v1/trainers/${ash.id}/captures`)
      .send({ pokemonName: 'pikachu' })
      .expect(401);
    await api()
      .post(`/api/v1/trainers/${ash.id}/captures`)
      .set(...bearer(gary))
      .send({ pokemonName: 'pikachu' })
      .expect(403);
    await api()
      .post(`/api/v1/trainers/${ash.id}/captures`)
      .set(...bearer(admin))
      .send({ pokemonName: 'eevee' })
      .expect(201);
  });
});

describe('GET /api/v1/trainers/:trainerId/team (pública, não descontinuada)', () => {
  it('mostra o time sem dados pessoais do treinador', async () => {
    const ash = await createSession('Ash');
    await api()
      .post('/api/v1/me/team/catch')
      .set(...bearer(ash))
      .send({ pokemonName: 'pikachu' })
      .expect(201);

    const res = await api().get(`/api/v1/trainers/${ash.id}/team`).expect(200);

    expect(res.body).toMatchObject({ trainerId: ash.id, size: 1, maxSize: 6 });
    expect(res.headers['deprecation']).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/ash@test\.com|passwordHash|role/);
  });

  it('treinador inexistente dá 404', async () => {
    await api().get('/api/v1/trainers/00000000-0000-4000-8000-000000000000/team').expect(404);
  });
});
