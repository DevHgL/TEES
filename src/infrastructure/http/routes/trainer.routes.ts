import { RequestHandler, Router } from 'express';

import { TrainerController } from '@infrastructure/http/controllers/TrainerController';
import { ensureRole } from '@infrastructure/http/middlewares/ensureRole';

export function trainerRoutes(
  controller: TrainerController,
  authenticated: RequestHandler,
): Router {
  const router = Router();
  const canManageRoles = ensureRole('GYM_LEADER', 'ADMIN');

  // Lista completa (com e-mails) só para quem administra perfis.
  router.get('/', authenticated, canManageRoles, controller.list);
  router.post('/', controller.create);
  router.post('/:trainerId/captures', authenticated, controller.capture);
  router.get('/:trainerId/team', controller.team);
  router.patch('/:id/role', authenticated, canManageRoles, controller.changeRole);

  return router;
}
