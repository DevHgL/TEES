import { ITokenService } from '@application/ports/ITokenService';
import { Trainer } from '@domain/entities/Trainer';
import { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

/** Emite o par access token (JWT) + refresh token, persistindo o hash do refresh. */
export class AuthTokensIssuer {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async issue(trainer: Trainer): Promise<AuthTokens> {
    const refreshToken = this.tokenService.generateRefreshToken();

    await this.refreshTokenRepository.create({
      trainerId: trainer.id,
      tokenHash: this.tokenService.hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + this.tokenService.refreshTokenTtlMs),
    });

    return {
      accessToken: this.tokenService.generateAccessToken({
        trainerId: trainer.id,
        role: trainer.role,
      }),
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.tokenService.accessTokenTtlSeconds,
    };
  }
}
