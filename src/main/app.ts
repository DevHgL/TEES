import path from 'node:path';

import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';

import { openApiDocument } from '@infrastructure/http/docs/openapi';
import { ensureAuthenticated } from '@infrastructure/http/middlewares/ensureAuthenticated';
import { errorHandler } from '@infrastructure/http/middlewares/errorHandler';
import { notFound } from '@infrastructure/http/middlewares/notFound';
import {
  apiRateLimit,
  corsPolicy,
  loginRateLimit,
  securityHeaders,
  SecurityOptions,
} from '@infrastructure/http/middlewares/security';
import { authRoutes } from '@infrastructure/http/routes/auth.routes';
import { meRoutes } from '@infrastructure/http/routes/me.routes';
import { pokedexRoutes } from '@infrastructure/http/routes/pokedex.routes';
import { pokemonRoutes } from '@infrastructure/http/routes/pokemon.routes';
import { statsRoutes } from '@infrastructure/http/routes/stats.routes';
import { trainerRoutes } from '@infrastructure/http/routes/trainer.routes';

import { env } from '@main/config/env';
import { makeAuthController } from '@main/factories/authController.factory';
import { tokenService } from '@main/factories/authProviders.factory';
import { makeMeController } from '@main/factories/meController.factory';
import { makePokedexController } from '@main/factories/pokedexController.factory';
import { makePokemonController } from '@main/factories/pokemonController.factory';
import { makeStatsController } from '@main/factories/statsController.factory';
import { makeTrainerController } from '@main/factories/trainerController.factory';

export function createApp(): Application {
  const app = express();
  const security: SecurityOptions = {
    isProduction: env.isProduction,
    corsOrigins: env.corsOrigins,
    rateLimitWindowMinutes: env.rateLimitWindowMinutes,
    rateLimitMax: env.rateLimitMax,
    loginRateLimitMax: env.loginRateLimitMax,
  };

  // Atrás do proxy do provedor de nuvem, o IP real do cliente vem no X-Forwarded-For
  // (necessário para o rate limit contar por cliente, e não pelo proxy).
  if (env.isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(securityHeaders(security));
  app.use(corsPolicy(security));
  // Limite de tamanho do corpo: evita payloads gigantes (negação de serviço).
  app.use(express.json({ limit: '10kb' }));

  // Frontend estático (public/), servido na raiz da API.
  app.use(express.static(path.resolve(__dirname, '../../public')));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  const authenticated = ensureAuthenticated(tokenService);

  app.use('/api', apiRateLimit(security));
  app.use('/api/v1/auth', authRoutes(makeAuthController(), loginRateLimit(security)));
  app.use('/api/v1/me', meRoutes(makeMeController(), authenticated));
  app.use('/api/v1/pokemons', pokemonRoutes(makePokemonController(), authenticated));
  app.use('/api/v1/pokedex', pokedexRoutes(makePokedexController()));
  app.use('/api/v1/trainers', trainerRoutes(makeTrainerController(), authenticated));
  app.use('/api/v1/stats', statsRoutes(makeStatsController()));

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}
