import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase';
import { RefreshSessionUseCase } from '@application/use-cases/auth/RefreshSessionUseCase';
import { CreateTrainerUseCase } from '@application/use-cases/trainer/CreateTrainerUseCase';

import { AuthController } from '@infrastructure/http/controllers/AuthController';
import { PrismaTrainerRepository } from '@infrastructure/repositories/PrismaTrainerRepository';

import { prisma } from '@main/config/database';
import {
  authTokensIssuer,
  passwordHasher,
  refreshTokenCookie,
  refreshTokenRepository,
  tokenService,
} from '@main/factories/authProviders.factory';

export function makeAuthController(): AuthController {
  const trainerRepository = new PrismaTrainerRepository(prisma);

  return new AuthController(
    new CreateTrainerUseCase(trainerRepository, passwordHasher),
    new LoginUseCase(trainerRepository, passwordHasher, authTokensIssuer),
    new RefreshSessionUseCase(
      refreshTokenRepository,
      trainerRepository,
      tokenService,
      authTokensIssuer,
    ),
    new LogoutUseCase(refreshTokenRepository, tokenService),
    refreshTokenCookie,
  );
}
