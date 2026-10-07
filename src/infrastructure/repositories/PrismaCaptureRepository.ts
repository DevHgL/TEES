import { Capture } from '@domain/entities/Capture';
import { CreateCaptureData, ICaptureRepository } from '@domain/repositories/ICaptureRepository';

import {
  Capture as CaptureRecord,
  PrismaClient,
} from '@infrastructure/database/generated/prisma/client';

export class PrismaCaptureRepository implements ICaptureRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateCaptureData): Promise<Capture> {
    const record = await this.prisma.capture.create({
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
