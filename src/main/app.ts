import path from 'node:path';

import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';

import { openApiDocument } from '@infrastructure/http/docs/openapi';
import { errorHandler } from '@infrastructure/http/middlewares/errorHandler';
import { pokedexRoutes } from '@infrastructure/http/routes/pokedex.routes';
import { pokemonRoutes } from '@infrastructure/http/routes/pokemon.routes';
import { statsRoutes } from '@infrastructure/http/routes/stats.routes';
import { trainerRoutes } from '@infrastructure/http/routes/trainer.routes';

import { makePokedexController } from '@main/factories/pokedexController.factory';
import { makePokemonController } from '@main/factories/pokemonController.factory';
import { makeStatsController } from '@main/factories/statsController.factory';
import { makeTrainerController } from '@main/factories/trainerController.factory';

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  // Frontend estático (public/), servido na raiz da API.
  app.use(express.static(path.resolve(__dirname, '../../public')));

  app.use('/api/v1/pokemons', pokemonRoutes(makePokemonController()));
  app.use('/api/v1/pokedex', pokedexRoutes(makePokedexController()));
  app.use('/api/v1/trainers', trainerRoutes(makeTrainerController()));
  app.use('/api/v1/stats', statsRoutes(makeStatsController()));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(errorHandler);

  return app;
}
