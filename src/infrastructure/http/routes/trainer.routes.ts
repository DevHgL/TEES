import { Router } from 'express';

import { TrainerController } from '@infrastructure/http/controllers/TrainerController';

export function trainerRoutes(controller: TrainerController): Router {
  const router = Router();

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.post('/:trainerId/captures', controller.capture);
  router.get('/:trainerId/team', controller.team);

  return router;
}
