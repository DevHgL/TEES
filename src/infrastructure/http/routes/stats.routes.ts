import { Router } from 'express';

import { StatsController } from '@infrastructure/http/controllers/StatsController';

export function statsRoutes(controller: StatsController): Router {
  const router = Router();

  router.get('/', controller.get);

  return router;
}
