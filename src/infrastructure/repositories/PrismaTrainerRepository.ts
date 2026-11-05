import { Role, Trainer } from '@domain/entities/Trainer';
import { TrainerEmailAlreadyInUseError } from '@domain/errors/TrainerEmailAlreadyInUseError';
import {
  CreateTrainerData,
  ITrainerRepository,
  TrainerFilter,
} from '@domain/repositories/ITrainerRepository';
import { Paginated, PaginationParams } from '@domain/repositories/Pagination';

import { isUniqueConstraintError } from '@infrastructure/database/prismaErrors';
import {
  Prisma,
  PrismaClient,
  Trainer as TrainerRecord,
} from '@infrastructure/database/generated/prisma/client';

export class PrismaTrainerRepository implements ITrainerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(
    { search }: TrainerFilter,
    { page, limit }: PaginationParams,
  ): Promise<Paginated<Trainer>> {
    const where: Prisma.TrainerWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [records, total] = await this.prisma.$transaction([
      this.prisma.trainer.findMany({
        where,
        // id desempata registros com o mesmo createdAt, mantendo a paginação estável.
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trainer.count({ where }),
    ]);

    return {
      data: records.map(toDomain),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
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

  async updateRole(id: string, role: Role): Promise<Trainer> {
    const record = await this.prisma.trainer.update({ where: { id }, data: { role } });
    return toDomain(record);
  }

  async countByRole(role: Role): Promise<number> {
    return this.prisma.trainer.count({ where: { role } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.trainer.delete({ where: { id } });
  }
}

function toDomain(record: TrainerRecord): Trainer {
  return new Trainer({
    id: record.id,
    name: record.name,
    email: record.email,
    passwordHash: record.passwordHash ?? undefined,
    role: record.role,
    createdAt: record.createdAt,
  });
}
