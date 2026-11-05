import { Request, Response } from 'express';

import { AuthTokens } from '@application/services/AuthTokensIssuer';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase';
import { RefreshSessionUseCase } from '@application/use-cases/auth/RefreshSessionUseCase';
import { CreateTrainerUseCase } from '@application/use-cases/trainer/CreateTrainerUseCase';
import { UnauthorizedError } from '@domain/errors/UnauthorizedError';

import { RefreshTokenCookie } from '@infrastructure/http/cookies/refreshTokenCookie';
import { toTrainerDTO } from '@infrastructure/http/presenters/trainerPresenter';
import { loginSchema, registerSchema } from '@infrastructure/http/validators/auth.schemas';

export class AuthController {
  constructor(
    private readonly createTrainerUseCase: CreateTrainerUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenCookie: RefreshTokenCookie,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const data = registerSchema.parse(req.body);
    const trainer = await this.createTrainerUseCase.execute(data);
    res.status(201).json(toTrainerDTO(trainer));
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const credentials = loginSchema.parse(req.body);
    const { trainer, ...tokens } = await this.loginUseCase.execute(credentials);
    res
      .status(200)
      .json({ ...this.withRefreshCookie(res, tokens), trainer: toTrainerDTO(trainer) });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = this.refreshTokenCookie.read(req);

    if (!refreshToken) {
      throw new UnauthorizedError('Sessão não encontrada. Faça login.');
    }

    try {
      const tokens = await this.refreshSessionUseCase.execute(refreshToken);
      res.status(200).json(this.withRefreshCookie(res, tokens));
    } catch (err) {
      // Token inválido, expirado ou reutilizado: o cookie não serve mais.
      this.refreshTokenCookie.clear(res);
      throw err;
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = this.refreshTokenCookie.read(req);

    if (refreshToken) {
      await this.logoutUseCase.execute(refreshToken);
    }

    this.refreshTokenCookie.clear(res);
    res.status(204).send();
  };

  /**
   * Grava o refresh token no cookie httpOnly e o tira do JSON: se ele voltasse no corpo,
   * um script injetado (XSS) poderia chamar /auth/refresh e lê-lo, anulando o cookie.
   */
  private withRefreshCookie(res: Response, { refreshToken, ...tokens }: AuthTokens) {
    this.refreshTokenCookie.set(res, refreshToken);
    return tokens;
  }
}
