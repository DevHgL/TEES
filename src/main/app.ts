import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';

import { openApiDocument } from '@infrastructure/http/docs/openapi';
import { errorHandler } from '@infrastructure/http/middlewares/errorHandler';
import { pokemonRoutes } from '@infrastructure/http/routes/pokemon.routes';

import { makePokemonController } from '@main/factories/pokemonController.factory';

export function createApp(): Application {
  const app = express();

  app.use(express.json());

  app.use('/api/v1/pokemons', pokemonRoutes(makePokemonController()));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(errorHandler);

  return app;
}
