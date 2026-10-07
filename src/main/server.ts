import '@main/config/loadEnv';

import { createApp } from '@main/app';
import { prisma } from '@main/config/database';
import { env } from '@main/config/env';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`PokéManager API rodando em http://localhost:${env.port}`);
  console.log(`Documentação Swagger disponível em http://localhost:${env.port}/api/docs`);
});

function shutdown(): void {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
