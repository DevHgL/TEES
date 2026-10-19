import { Request, Response } from 'express';

import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase';
import { RefreshSessionUseCase } from '@application/use-cases/auth/RefreshSessionUseCase';
import { CreateTrainerUseCase } from '@application/use-cases/trainer/CreateTrainerUseCase';

import { toTrainerDTO } from '@infrastructure/http/presenters/trainerPresenter';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from '@infrastructure/http/validators/auth.schemas';

export class AuthController {
  constructor(
    private readonly createTrainerUseCase: CreateTrainerUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const data = registerSchema.parse(req.body);
    const trainer = await this.createTrainerUseCase.execute(data);
    res.status(201).json(toTrainerDTO(trainer));
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const credentials = loginSchema.parse(req.body);
    const { trainer, ...tokens } = await this.loginUseCase.execute(credentials);
    res.status(200).json({ ...tokens, trainer: toTrainerDTO(trainer) });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const tokens = await this.refreshSessionUseCase.execute(refreshToken);
    res.status(200).json(tokens);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    await this.logoutUseCase.execute(refreshToken);
    res.status(204).send();
  };
}
