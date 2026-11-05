import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@main/config/database';

import { api, bearer, createSession, resetDatabase } from './helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('PATCH /api/v1/me/team/:captureId (apelido)', () => {
  it('o dono troca e remove o apelido; o time mostra o novo nome', async () => {
    const ash = await createSession('Ash');
    const { body: capture } = await api()
      .post('/api/v1/me/team/catch')
      .set(...bearer(ash))
      .send({ pokemonName: 'pikachu' })
      .expect(201);

    const renamed = await api()
      .patch(`/api/v1/me/team/${capture.id}`)
      .set(...bearer(ash))
      .send({ nickname: '  Sparky  ' })
      .expect(200);
    expect(renamed.body).toMatchObject({ id: capture.id, name: 'pikachu', nickname: 'Sparky' });

    const team = await api()
      .get('/api/v1/me/team')
      .set(...bearer(ash))
      .expect(200);
    expect(team.body.pokemons[0].nickname).toBe('Sparky');

    const cleared = await api()
      .patch(`/api/v1/me/team/${capture.id}`)
      .set(...bearer(ash))
      .send({ nickname: null })
      .expect(200);
    expect(cleared.body).not.toHaveProperty('nickname');
  });

  it('valida o apelido e protege o Pokémon de outros treinadores', async () => {
    const ash = await createSession('Ash');
    const gary = await createSession('Gary');
    const { body: capture } = await api()
      .post('/api/v1/me/team/catch')
      .set(...bearer(ash))
      .send({ pokemonName: 'pikachu' })
      .expect(201);
    const url = `/api/v1/me/team/${capture.id}`;

    await api().patch(url).send({ nickname: 'X' }).expect(401);
    await api()
      .patch(url)
      .set(...bearer(gary))
      .send({ nickname: 'Roubado' })
      .expect(403);
    await api()
      .patch(url)
      .set(...bearer(ash))
      .send({})
      .expect(400);
    await api()
      .patch(url)
      .set(...bearer(ash))
      .send({ nickname: '   ' })
      .expect(400);
    await api()
      .patch(url)
      .set(...bearer(ash))
      .send({ nickname: 'x'.repeat(31) })
      .expect(400);
    await api()
      .patch('/api/v1/me/team/00000000-0000-4000-8000-000000000000')
      .set(...bearer(ash))
      .send({ nickname: 'X' })
      .expect(404);
  });
});

describe('GET /api/v1/trainers (paginado)', () => {
  it('pagina na ordem de cadastro e busca por nome ou e-mail', async () => {
    const admin = await createSession('Admin', 'ADMIN');
    for (const name of ['Brock', 'Misty', 'Gary']) {
      await createSession(name);
    }

    const first = await api()
      .get('/api/v1/trainers?limit=2')
      .set(...bearer(admin))
      .expect(200);
    expect(first.body).toMatchObject({ page: 1, limit: 2, total: 4, totalPages: 2 });
    expect(first.body.data.map((t: { name: string }) => t.name)).toEqual(['Admin', 'Brock']);

    const second = await api()
      .get('/api/v1/trainers?limit=2&page=2')
      .set(...bearer(admin))
      .expect(200);
    expect(second.body.data.map((t: { name: string }) => t.name)).toEqual(['Misty', 'Gary']);

    const byName = await api()
      .get('/api/v1/trainers?search=MIS')
      .set(...bearer(admin))
      .expect(200);
    expect(byName.body.data.map((t: { name: string }) => t.name)).toEqual(['Misty']);

    const byEmail = await api()
      .get('/api/v1/trainers?search=gary@test')
      .set(...bearer(admin))
      .expect(200);
    expect(byEmail.body.total).toBe(1);

    expect(JSON.stringify(first.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it('continua restrita a GYM_LEADER/ADMIN e valida a query', async () => {
    const ash = await createSession('Ash');
    const admin = await createSession('Admin', 'ADMIN');

    await api()
      .get('/api/v1/trainers')
      .set(...bearer(ash))
      .expect(403);
    await api()
      .get('/api/v1/trainers?limit=500')
      .set(...bearer(admin))
      .expect(400);
    await api()
      .get('/api/v1/trainers?page=0')
      .set(...bearer(admin))
      .expect(400);
  });
});
