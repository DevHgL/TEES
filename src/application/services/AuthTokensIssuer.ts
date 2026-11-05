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
    const now = new Date();
    // Limpeza a cada login/refresh: sem isso a tabela só cresce (um token por login).
    await this.refreshTokenRepository.deleteExpiredForTrainer(trainer.id, now);

    const refreshToken = this.tokenService.generateRefreshToken();

    await this.refreshTokenRepository.create({
      trainerId: trainer.id,
      tokenHash: this.tokenService.hashRefreshToken(refreshToken),
      expiresAt: new Date(now.getTime() + this.tokenService.refreshTokenTtlMs),
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
