export interface RefreshTokenRecord {
  id: string;
  trainerId: string;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface CreateRefreshTokenData {
  trainerId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<void>;
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
  /** Revoga todas as sessões do treinador (usado ao detectar reuso de token). */
  revokeAllForTrainer(trainerId: string): Promise<void>;
  /**
   * Apaga os tokens já expirados do treinador. Os revogados mas ainda válidos ficam, porque
   * são eles que permitem detectar o reuso de um token roubado.
   */
  deleteExpiredForTrainer(trainerId: string, now: Date): Promise<void>;
}
