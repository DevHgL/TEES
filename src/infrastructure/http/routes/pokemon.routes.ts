import { Router } from 'express';

import { PokemonController } from '@infrastructure/http/controllers/PokemonController';

export function pokemonRoutes(controller: PokemonController): Router {
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
