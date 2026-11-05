import '@main/config/loadEnv';

import { createApp } from '@main/app';
import { prisma } from '@main/config/database';
import { env } from '@main/config/env';
import { logger } from '@main/config/logger';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`PokéManager API rodando em http://localhost:${env.port}`);
  logger.info(`Documentação Swagger disponível em http://localhost:${env.port}/api/docs`);
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, 'Encerrando o servidor');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
