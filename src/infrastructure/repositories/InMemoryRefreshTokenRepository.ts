import { randomUUID } from 'node:crypto';

import {
  CreateRefreshTokenData,
  IRefreshTokenRepository,
  RefreshTokenRecord,
} from '@domain/repositories/IRefreshTokenRepository';

interface StoredRefreshToken extends RefreshTokenRecord {
  tokenHash: string;
}

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly tokens = new Map<string, StoredRefreshToken>();

  async create(data: CreateRefreshTokenData): Promise<void> {
    const id = randomUUID();
    this.tokens.set(id, { id, ...data });
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return Array.from(this.tokens.values()).find((t) => t.tokenHash === tokenHash) ?? null;
  }

  async revoke(id: string): Promise<void> {
    const token = this.tokens.get(id);

    if (token) {
      token.revokedAt = new Date();
    }
  }

  async revokeAllForTrainer(trainerId: string): Promise<void> {
    for (const token of this.tokens.values()) {
      if (token.trainerId === trainerId && !token.revokedAt) {
        token.revokedAt = new Date();
      }
    }
  }

  async deleteExpiredForTrainer(trainerId: string, now: Date): Promise<void> {
    for (const [id, token] of this.tokens) {
      if (token.trainerId === trainerId && token.expiresAt <= now) {
        this.tokens.delete(id);
      }
    }
  }

  /** Total de tokens guardados (usado nos testes). */
  get size(): number {
    return this.tokens.size;
  }
}
