import { NextFunction, Request, RequestHandler, Response } from 'express';

import { Role } from '@domain/entities/Trainer';
import { ForbiddenError } from '@domain/errors/ForbiddenError';

import { getAuth } from '@infrastructure/http/middlewares/ensureAuthenticated';

/** RBAC: libera a rota apenas para os papéis informados. Usar depois do ensureAuthenticated. */
export function ensureRole(...allowed: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!allowed.includes(getAuth(req).role)) {
      throw new ForbiddenError(`Acesso restrito a: ${allowed.join(', ')}.`);
    }

    next();
  };
}
