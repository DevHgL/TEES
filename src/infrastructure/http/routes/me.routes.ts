import { RequestHandler, Router } from 'express';

import { MeController } from '@infrastructure/http/controllers/MeController';

export function meRoutes(
  controller: MeController,
  authenticated: RequestHandler,
  /** O mesmo limitador do login: senhas erradas aqui gastam o mesmo limite de tentativas. */
  passwordLimiter: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticated);
  router.get('/', controller.profile);
  router.delete('/', passwordLimiter, controller.deleteAccount);
  router.get('/team', controller.team);
  router.post('/team/catch', controller.catch);
  router.delete('/team/:captureId', controller.release);

  return router;
}
