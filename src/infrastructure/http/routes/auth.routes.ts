import { RequestHandler, Router } from 'express';

import { AuthController } from '@infrastructure/http/controllers/AuthController';

export function authRoutes(controller: AuthController, loginLimiter: RequestHandler): Router {
  const router = Router();

  router.post('/register', controller.register);
  router.post('/login', loginLimiter, controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);

  return router;
}
