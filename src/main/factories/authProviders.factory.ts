import { IPasswordHasher } from '@application/ports/IPasswordHasher';
import { ITokenService } from '@application/ports/ITokenService';
import { AuthTokensIssuer } from '@application/services/AuthTokensIssuer';

import { RefreshTokenCookie } from '@infrastructure/http/cookies/refreshTokenCookie';
import { BcryptPasswordHasher } from '@infrastructure/providers/BcryptPasswordHasher';
import { JwtTokenService } from '@infrastructure/providers/JwtTokenService';
import { PrismaRefreshTokenRepository } from '@infrastructure/repositories/PrismaRefreshTokenRepository';

import { prisma } from '@main/config/database';
import { env } from '@main/config/env';

export const tokenService: ITokenService = new JwtTokenService(
  env.jwtSecret,
  env.jwtExpiresInMinutes,
  env.refreshTokenTtlDays,
);

export const passwordHasher: IPasswordHasher = new BcryptPasswordHasher(env.bcryptRounds);

export const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma);

export const authTokensIssuer = new AuthTokensIssuer(tokenService, refreshTokenRepository);

export const refreshTokenCookie = new RefreshTokenCookie({
  secure: env.isProduction,
  maxAgeMs: tokenService.refreshTokenTtlMs,
});
