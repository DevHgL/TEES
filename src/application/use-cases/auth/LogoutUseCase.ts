import { ITokenService } from '@application/ports/ITokenService';
import { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository';

/** Encerra a sessão revogando o refresh token. Idempotente: token desconhecido é ignorado. */
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const record = await this.refreshTokenRepository.findByHash(
      this.tokenService.hashRefreshToken(refreshToken),
    );

    if (record && !record.revokedAt) {
      await this.refreshTokenRepository.revoke(record.id);
    }
  }
}
