import { CookieOptions, Request, Response } from 'express';

export const REFRESH_TOKEN_COOKIE = 'pokemanager_refresh';

/** Só as rotas que usam o refresh token recebem o cookie (o resto da API nunca o vê). */
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';

export interface RefreshTokenCookieOptions {
  /** Em produção (HTTPS) o cookie só trafega criptografado. */
  secure: boolean;
  maxAgeMs: number;
}

/**
 * O refresh token vive só neste cookie:
 *  - httpOnly: JavaScript não lê (um XSS não consegue roubá-lo);
 *  - SameSite=Strict: não é enviado em requisições vindas de outros sites (CSRF);
 *  - Path restrito: só vai para /auth/refresh e /auth/logout.
 */
export class RefreshTokenCookie {
  constructor(private readonly options: RefreshTokenCookieOptions) {}

  private get baseOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.options.secure,
      sameSite: 'strict',
      path: REFRESH_TOKEN_COOKIE_PATH,
    };
  }

  set(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...this.baseOptions,
      maxAge: this.options.maxAgeMs,
    });
  }

  clear(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.baseOptions);
  }

  read(req: Request): string | undefined {
    const value: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE];
    return typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : undefined;
  }
}
