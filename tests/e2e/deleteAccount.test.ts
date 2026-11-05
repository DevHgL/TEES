import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@main/config/database';

import { api, bearer, createSession, PASSWORD, resetDatabase } from './helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('DELETE /api/v1/me', () => {
  it('apaga a conta, as capturas e as sessões', async () => {
    const ash = await createSession('Ash');
    await api()
      .post('/api/v1/me/team/catch')
      .set(...bearer(ash))
      .send({ pokemonName: 'pikachu' })
      .expect(201);

    const res = await api()
      .delete('/api/v1/me')
      .set(...bearer(ash))
      .send({ password: PASSWORD })
      .expect(204);
    expect(String(res.headers['set-cookie'])).toMatch(/pokemanager_refresh=;/);

    expect(await prisma.trainer.count({ where: { id: ash.id } })).toBe(0);
    expect(await prisma.capture.count({ where: { trainerId: ash.id } })).toBe(0);
    expect(await prisma.refreshToken.count({ where: { trainerId: ash.id } })).toBe(0);

    // O e-mail fica livre e o refresh token antigo não serve mais.
    await api().post('/api/v1/auth/refresh').set('Cookie', ash.refreshCookie).expect(401);
    await api()
      .post('/api/v1/auth/register')
      .send({ name: 'Ash', email: 'ash@test.com', password: PASSWORD })
      .expect(201);
  });

  it('exige token e a senha atual', async () => {
    const ash = await createSession('Ash');

    await api().delete('/api/v1/me').send({ password: PASSWORD }).expect(401);
    await api()
      .delete('/api/v1/me')
      .set(...bearer(ash))
      .send({})
      .expect(400);
    await api()
      .delete('/api/v1/me')
      .set(...bearer(ash))
      .send({ password: 'errada123' })
      .expect(403);

    expect(await prisma.trainer.count({ where: { id: ash.id } })).toBe(1);
  });

  it('o último ADMIN não pode apagar a própria conta', async () => {
    const admin = await createSession('Admin', 'ADMIN');

    const res = await api()
      .delete('/api/v1/me')
      .set(...bearer(admin))
      .send({ password: PASSWORD })
      .expect(403);
    expect(res.body.message).toMatch(/último ADMIN/);
  });
});
