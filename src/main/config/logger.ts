import pino from 'pino';

import { env } from '@main/config/env';

/**
 * Logs estruturados em JSON (uma linha por evento), prontos para o painel do Render.
 * Em desenvolvimento, `npm run dev` passa a saída pelo pino-pretty para ficar legível.
 */
export const logger = pino({
  level: env.logLevel,
  base: { service: 'pokemanager-api', env: env.nodeEnv },
  // Nunca grava credenciais nos logs.
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    censor: '[REDACTED]',
  },
});
