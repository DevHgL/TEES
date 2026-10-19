import { NextFunction, Request, RequestHandler, Response } from 'express';

import { AccessTokenPayload, ITokenService } from '@application/ports/ITokenService';
import { UnauthorizedError } from '@domain/errors/UnauthorizedError';

/** Exige o cabeçalho `Authorization: Bearer <token>` com um JWT válido. */
export function ensureAuthenticated(tokenService: ITokenService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Envie o cabeçalho Authorization: Bearer <token>.');
    }

    const payload = tokenService.verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedError('Token inválido ou expirado.');
    }

    req.auth = payload;
    next();
  };
}

/** Lê o treinador autenticado da requisição (para rotas atrás do ensureAuthenticated). */
export function getAuth(req: Request): AccessTokenPayload {
  if (!req.auth) {
    throw new UnauthorizedError();
  }

  return req.auth;
}
