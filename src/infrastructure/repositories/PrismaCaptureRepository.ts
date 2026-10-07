import { Capture } from '@domain/entities/Capture';
import { CreateCaptureData, ICaptureRepository } from '@domain/repositories/ICaptureRepository';

import {
  Capture as CaptureRecord,
  PrismaClient,
} from '@infrastructure/database/generated/prisma/client';

export class PrismaCaptureRepository implements ICaptureRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createWithinTeamLimit(
    data: CreateCaptureData,
    maxTeamSize: number,
  ): Promise<Capture | null> {
    return this.prisma.$transaction(async (tx) => {
      // Trava a linha do treinador até o fim da transação: capturas simultâneas do mesmo
      // treinador são serializadas e a contagem abaixo não pode ficar desatualizada.
      await tx.$queryRaw`SELECT id FROM trainers WHERE id = ${data.trainerId}::uuid FOR UPDATE`;

      const teamSize = await tx.capture.count({ where: { trainerId: data.trainerId } });

      if (teamSize >= maxTeamSize) {
        return null;
      }

      const record = await tx.capture.create({
        data: {
          trainerId: data.trainerId,
          pokedexNumber: data.pokedexNumber,
          name: data.name,
          nickname: data.nickname,
          types: data.types,
          ...data.baseStats,
          imageUrl: data.imageUrl,
        },
      });

      return toDomain(record);
    });
  }

  async findByTrainerId(trainerId: string): Promise<Capture[]> {
    const records = await this.prisma.capture.findMany({
      where: { trainerId },
      orderBy: { capturedAt: 'asc' },
    });

    return records.map(toDomain);
  }

  async countByTrainerId(trainerId: string): Promise<number> {
    return this.prisma.capture.count({ where: { trainerId } });
  }
}

function toDomain(record: CaptureRecord): Capture {
  return new Capture({
    id: record.id,
    trainerId: record.trainerId,
    pokedexNumber: record.pokedexNumber,
    name: record.name,
    nickname: record.nickname ?? undefined,
    types: record.types,
    baseStats: {
      hp: record.hp,
      attack: record.attack,
      defense: record.defense,
      specialAttack: record.specialAttack,
      specialDefense: record.specialDefense,
      speed: record.speed,
    },
    imageUrl: record.imageUrl ?? undefined,
    capturedAt: record.capturedAt,
  });
}
