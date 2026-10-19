import { AccessTokenPayload } from '@application/ports/ITokenService';

declare global {
  namespace Express {
    interface Request {
      /** Preenchido pelo middleware ensureAuthenticated. */
      auth?: AccessTokenPayload;
    }
  }
}

export {};
