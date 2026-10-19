import { RequestHandler, Router } from 'express';

import { PokemonController } from '@infrastructure/http/controllers/PokemonController';
import { ensureRole } from '@infrastructure/http/middlewares/ensureRole';

export function pokemonRoutes(
  controller: PokemonController,
  authenticated: RequestHandler,
): Router {
  const router = Router();
  // Leitura do catálogo é pública; alterações, só para quem administra (GYM_LEADER/ADMIN).
  const canEdit = [authenticated, ensureRole('GYM_LEADER', 'ADMIN')];

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', ...canEdit, controller.create);
  router.put('/:id', ...canEdit, controller.update);
  router.delete('/:id', ...canEdit, controller.remove);

  return router;
}
