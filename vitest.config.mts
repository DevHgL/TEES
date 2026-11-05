import path from 'node:path';

import { defineConfig } from 'vitest/config';

const alias = {
  '@domain': path.resolve(import.meta.dirname, 'src/domain'),
  '@application': path.resolve(import.meta.dirname, 'src/application'),
  '@infrastructure': path.resolve(import.meta.dirname, 'src/infrastructure'),
  '@main': path.resolve(import.meta.dirname, 'src/main'),
};

/** Banco separado para os testes E2E: os dados são apagados antes de cada teste. */
const testDatabaseUrl =
  process.env['TEST_DATABASE_URL'] ??
  'postgresql://pokemanager:pokemanager@localhost:5432/pokemanager_test?schema=public';

export default defineConfig({
  resolve: { alias },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/infrastructure/database/generated/**'],
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.test.ts'],
          globalSetup: ['tests/e2e/globalSetup.ts'],
          // Os testes compartilham o mesmo banco, então rodam um arquivo por vez.
          fileParallelism: false,
          env: {
            NODE_ENV: 'test',
            DATABASE_URL: testDatabaseUrl,
            POKEAPI_BASE_URL: 'http://localhost:4010/api/v2',
            JWT_SECRET: 'segredo-dos-testes-e2e-com-mais-de-32-caracteres',
            BCRYPT_ROUNDS: '10',
            LOGIN_RATE_LIMIT_MAX: '3',
            RATE_LIMIT_MAX: '10000',
          },
        },
      },
    ],
  },
});
