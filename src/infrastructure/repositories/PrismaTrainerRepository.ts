import { Trainer } from '@domain/entities/Trainer';
import { TrainerEmailAlreadyInUseError } from '@domain/errors/TrainerEmailAlreadyInUseError';
import { CreateTrainerData, ITrainerRepository } from '@domain/repositories/ITrainerRepository';

import { isUniqueConstraintError } from '@infrastructure/database/prismaErrors';
import {
  PrismaClient,
  Trainer as TrainerRecord,
} from '@infrastructure/database/generated/prisma/client';

export class PrismaTrainerRepository implements ITrainerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Trainer[]> {
    const records = await this.prisma.trainer.findMany({ orderBy: { createdAt: 'asc' } });
    return records.map(toDomain);
  }

  async findById(id: string): Promise<Trainer | null> {
    const record = await this.prisma.trainer.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Trainer | null> {
    const record = await this.prisma.trainer.findUnique({ where: { email } });
    return record ? toDomain(record) : null;
  }

  async create(data: CreateTrainerData): Promise<Trainer> {
    try {
      const record = await this.prisma.trainer.create({ data });
      return toDomain(record);
    } catch (err) {
      // Cobre a corrida entre a checagem do caso de uso e o INSERT.
      if (isUniqueConstraintError(err)) {
        throw new TrainerEmailAlreadyInUseError(data.email);
      }
      throw err;
    }
  }
}

function toDomain(record: TrainerRecord): Trainer {
  return new Trainer({
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: record.createdAt,
  });
}
