import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@main/config/database';

import { api, bearer, createSession, resetDatabase, Session } from './helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const TEAM = ['pikachu', 'charmander', 'squirtle', 'bulbasaur', 'eevee', 'snorlax'];

const catchPokemon = (session: Session, pokemonName: string) =>
  api()
    .post('/api/v1/me/team/catch')
    .set(...bearer(session))
    .send({ pokemonName });

describe('Rotas protegidas', () => {
  it('exigem Authorization: Bearer <token>', async () => {
    await api().get('/api/v1/me/team').expect(401);
    await api().get('/api/v1/me/team').set('Authorization', 'Bearer token-falso').expect(401);
    await api().post('/api/v1/me/team/catch').send({ pokemonName: 'pikachu' }).expect(401);
  });
});

describe('POST /api/v1/me/team/catch', () => {
  it('captura usando o treinador do token e os dados da PokéAPI', async () => {
    const ash = await createSession('Ash');

    const res = await catchPokemon(ash, 'Pikachu').expect(201);

    expect(res.body).toMatchObject({
      trainerId: ash.id,
      name: 'pikachu',
      pokedexNumber: 1,
      types: ['electric'],
      baseStats: expect.objectContaining({ hp: 35 }),
    });
  });

  it('recusa o 7º Pokémon do time', async () => {
    const ash = await createSession('Ash');
    for (const name of TEAM) {
      await catchPokemon(ash, name).expect(201);
    }

    const res = await catchPokemon(ash, 'mew').expect(422);
    expect(res.body.message).toMatch(/máximo de 6/);
  });

  it('Pokémon inexistente na PokéAPI dá 404', async () => {
    const ash = await createSession('Ash');
    await catchPokemon(ash, 'digimon').expect(404);
  });
});

describe('GET /api/v1/me/team', () => {
  it('lista o time atual do treinador autenticado', async () => {
    const ash = await createSession('Ash');
    const gary = await createSession('Gary');
    await catchPokemon(ash, 'pikachu').expect(201);
    await catchPokemon(ash, 'eevee').expect(201);
    await catchPokemon(gary, 'squirtle').expect(201);

    const res = await api()
      .get('/api/v1/me/team')
      .set(...bearer(ash))
      .expect(200);

    expect(res.body).toMatchObject({ trainerId: ash.id, size: 2, maxSize: 6 });
    expect(res.body.pokemons.map((p: { name: string }) => p.name).sort()).toEqual([
      'eevee',
      'pikachu',
    ]);
  });
});

describe('DELETE /api/v1/me/team/:captureId', () => {
  it('só o dono solta o Pokémon', async () => {
    const ash = await createSession('Ash');
    const gary = await createSession('Gary');
    const { body: capture } = await catchPokemon(ash, 'pikachu').expect(201);

    await api()
      .delete(`/api/v1/me/team/${capture.id}`)
      .set(...bearer(gary))
      .expect(403);
    await api()
      .delete(`/api/v1/me/team/${capture.id}`)
      .set(...bearer(ash))
      .expect(204);

    const team = await api()
      .get('/api/v1/me/team')
      .set(...bearer(ash))
      .expect(200);
    expect(team.body.size).toBe(0);
  });
});

describe('PATCH /api/v1/trainers/:id/role (RBAC)', () => {
  it('TRAINER recebe 403 e GYM_LEADER consegue promover', async () => {
    const ash = await createSession('Ash');
    const gary = await createSession('Gary');
    const brock = await createSession('Brock', 'GYM_LEADER');

    await api()
      .patch(`/api/v1/trainers/${gary.id}/role`)
      .set(...bearer(ash))
      .send({ role: 'GYM_LEADER' })
      .expect(403);

    const res = await api()
      .patch(`/api/v1/trainers/${gary.id}/role`)
      .set(...bearer(brock))
      .send({ role: 'GYM_LEADER' })
      .expect(200);
    expect(res.body.role).toBe('GYM_LEADER');
  });
});
