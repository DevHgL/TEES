import {
  CreateRefreshTokenData,
  IRefreshTokenRepository,
  RefreshTokenRecord,
} from '@domain/repositories/IRefreshTokenRepository';

import { PrismaClient } from '@infrastructure/database/generated/prisma/client';

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateRefreshTokenData): Promise<void> {
    await this.prisma.refreshToken.create({ data });
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      trainerId: record.trainerId,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt ?? undefined,
    };
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeAllForTrainer(trainerId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { trainerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
