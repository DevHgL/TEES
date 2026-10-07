import { Router } from 'express';

import { PokedexController } from '@infrastructure/http/controllers/PokedexController';

export function pokedexRoutes(controller: PokedexController): Router {
  const router = Router();

  router.get('/search', controller.search);

  return router;
}
