import { execSync } from 'node:child_process';

import type { TestProject } from 'vitest/node';

import { startPokeApiStub } from './pokeApiStub';

/** Aplica as migrations no banco de testes e sobe a PokéAPI falsa. */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const { DATABASE_URL } = project.config.env;

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL },
    stdio: 'inherit',
  });

  const port = Number(new URL(project.config.env['POKEAPI_BASE_URL']!).port);
  const stub = await startPokeApiStub(port);

  return () => new Promise((resolve) => stub.close(() => resolve()));
}
