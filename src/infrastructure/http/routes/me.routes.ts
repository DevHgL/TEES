import { RequestHandler, Router } from 'express';

import { MeController } from '@infrastructure/http/controllers/MeController';

export function meRoutes(controller: MeController, authenticated: RequestHandler): Router {
  const router = Router();

  router.use(authenticated);
  router.get('/', controller.profile);
  router.get('/team', controller.team);
  router.post('/team/catch', controller.catch);
  router.delete('/team/:captureId', controller.release);

  return router;
}
