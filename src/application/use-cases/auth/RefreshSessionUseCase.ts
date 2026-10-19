import { ITokenService } from '@application/ports/ITokenService';
import { AuthTokens, AuthTokensIssuer } from '@application/services/AuthTokensIssuer';
import { UnauthorizedError } from '@domain/errors/UnauthorizedError';
import { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository';
import { ITrainerRepository } from '@domain/repositories/ITrainerRepository';

/**
 * Troca um refresh token válido por um novo par de tokens (rotação): o token usado é
 * revogado. Se um token JÁ revogado for reapresentado, é sinal de roubo — todas as
 * sessões do treinador são encerradas.
 */
export class RefreshSessionUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly trainerRepository: ITrainerRepository,
    private readonly tokenService: ITokenService,
    private readonly tokensIssuer: AuthTokensIssuer,
  ) {}

  async execute(refreshToken: string): Promise<AuthTokens> {
    const record = await this.refreshTokenRepository.findByHash(
      this.tokenService.hashRefreshToken(refreshToken),
    );

    if (!record) {
      throw new UnauthorizedError('Refresh token inválido.');
    }

    if (record.revokedAt) {
      await this.refreshTokenRepository.revokeAllForTrainer(record.trainerId);
      throw new UnauthorizedError('Refresh token reutilizado. Faça login novamente.');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('Refresh token expirado. Faça login novamente.');
    }

    const trainer = await this.trainerRepository.findById(record.trainerId);

    if (!trainer) {
      throw new UnauthorizedError('Refresh token inválido.');
    }

    await this.refreshTokenRepository.revoke(record.id);
    return this.tokensIssuer.issue(trainer);
  }
}
