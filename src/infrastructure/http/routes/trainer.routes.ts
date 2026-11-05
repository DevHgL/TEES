import { RequestHandler, Router } from 'express';

import { TrainerController } from '@infrastructure/http/controllers/TrainerController';
import { deprecated } from '@infrastructure/http/middlewares/deprecated';
import { ensureRole } from '@infrastructure/http/middlewares/ensureRole';

/** Data em que as rotas legadas foram descontinuadas. */
const ENTREGA_4_DATE = new Date('2026-11-05T00:00:00Z');

export function trainerRoutes(
  controller: TrainerController,
  authenticated: RequestHandler,
): Router {
  const router = Router();
  const canManageRoles = ensureRole('GYM_LEADER', 'ADMIN');

  // Lista completa (com e-mails) só para quem administra perfis.
  router.get('/', authenticated, canManageRoles, controller.list);
  // Rotas da Entrega 2 mantidas por compatibilidade, mas descontinuadas: cada uma tem uma
  // substituta (o cadastro com senha e a captura com o ID vindo do token).
  router.post(
    '/',
    deprecated({ since: ENTREGA_4_DATE, successor: '/api/v1/auth/register' }),
    controller.create,
  );
  router.post(
    '/:trainerId/captures',
    deprecated({ since: ENTREGA_4_DATE, successor: '/api/v1/me/team/catch' }),
    authenticated,
    controller.capture,
  );
  // Não é duplicada: /me/team mostra o próprio time; esta, o time público de qualquer
  // treinador (só dados dos Pokémons, sem e-mail), como no ranking de /stats.
  router.get('/:trainerId/team', controller.team);
  router.patch('/:id/role', authenticated, canManageRoles, controller.changeRole);

  return router;
}
