import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@main/config/database';

import { api, bearer, createSession, resetDatabase, Session } from './helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const baseStats = {
  hp: 35,
  attack: 55,
  defense: 40,
  specialAttack: 50,
  specialDefense: 50,
  speed: 90,
};

const createPokemon = (session: Session, body: object) =>
  api()
    .post('/api/v1/pokemons')
    .set(...bearer(session))
    .send(body);

describe('Catálogo /api/v1/pokemons', () => {
  it('CRUD completo por um GYM_LEADER', async () => {
    const brock = await createSession('Brock', 'GYM_LEADER');

    const { body: created } = await createPokemon(brock, {
      name: 'Onix',
      types: ['ROCK', 'ground'],
      baseStats,
    }).expect(201);
    expect(created).toMatchObject({ name: 'Onix', types: ['rock', 'ground'] });

    await api().get(`/api/v1/pokemons/${created.id}`).expect(200);

    const { body: updated } = await api()
      .put(`/api/v1/pokemons/${created.id}`)
      .set(...bearer(brock))
      .send({ name: 'Steelix' })
      .expect(200);
    expect(updated).toMatchObject({ name: 'Steelix', types: ['rock', 'ground'] });

    await api()
      .delete(`/api/v1/pokemons/${created.id}`)
      .set(...bearer(brock))
      .expect(204);
    await api().get(`/api/v1/pokemons/${created.id}`).expect(404);
  });

  it('listagem pública com filtro por tipo, busca por nome e paginação', async () => {
    const admin = await createSession('Admin', 'ADMIN');
    for (const [name, types] of [
      ['Charmander', ['fire']],
      ['Charizard', ['fire', 'flying']],
      ['Squirtle', ['water']],
    ] as const) {
      await createPokemon(admin, { name, types, baseStats }).expect(201);
    }

    const fire = await api().get('/api/v1/pokemons?type=fire').expect(200);
    expect(fire.body.data.map((p: { name: string }) => p.name)).toEqual([
      'Charmander',
      'Charizard',
    ]);

    const page = await api().get('/api/v1/pokemons?name=CHAR&limit=1&page=2').expect(200);
    expect(page.body).toMatchObject({ page: 2, limit: 1, total: 2, totalPages: 2 });
    expect(page.body.data).toHaveLength(1);
  });

  it('TRAINER e visitantes não alteram o catálogo', async () => {
    const ash = await createSession('Ash');

    await api()
      .post('/api/v1/pokemons')
      .send({ name: 'Mew', types: ['psychic'], baseStats })
      .expect(401);
    await createPokemon(ash, { name: 'Mew', types: ['psychic'], baseStats }).expect(403);
  });

  it('valida payload, parâmetros e query com Zod', async () => {
    const admin = await createSession('Admin', 'ADMIN');

    const invalid = await createPokemon(admin, {
      name: '',
      types: ['a', 'b', 'c'],
      baseStats: { ...baseStats, hp: 999 },
    }).expect(400);
    expect(invalid.body.errors.map((e: { path: string }) => e.path)).toEqual(
      expect.arrayContaining(['name', 'types', 'baseStats.hp']),
    );

    await api().get('/api/v1/pokemons/nao-e-uuid').expect(400);
    await api().get('/api/v1/pokemons?limit=500').expect(400);
    await api().get('/api/v1/pokemons/00000000-0000-4000-8000-000000000000').expect(404);
  });
});
