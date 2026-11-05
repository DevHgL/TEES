import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@main/config/database';

import { api, createSession, resetDatabase } from './helpers';

// Arquivo próprio: cada arquivo de teste tem sua instância da app, então o bloqueio do
// rate limit não afeta os outros testes de login.
beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('Rate limit do login', () => {
  it('bloqueia força bruta com 429 sem barrar quem acerta a senha antes', async () => {
    await createSession('Ash');

    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const res = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'ash@test.com', password: 'errada123' });
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 3)).toEqual([401, 401, 401]);
    expect(statuses.slice(3)).toEqual([429, 429]);
  });
});

describe('Cabeçalhos de segurança', () => {
  it('aplica Helmet e não libera CORS para origens desconhecidas', async () => {
    const res = await api().get('/api/v1/pokemons').set('Origin', 'http://evil.example');

    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
