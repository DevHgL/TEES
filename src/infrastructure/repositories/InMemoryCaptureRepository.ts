import { randomUUID } from 'node:crypto';

import { Capture } from '@domain/entities/Capture';
import { CreateCaptureData, ICaptureRepository } from '@domain/repositories/ICaptureRepository';

export class InMemoryCaptureRepository implements ICaptureRepository {
  private readonly captures = new Map<string, Capture>();

  async createWithinTeamLimit(
    data: CreateCaptureData,
    maxTeamSize: number,
  ): Promise<Capture | null> {
    if ((await this.countByTrainerId(data.trainerId)) >= maxTeamSize) {
      return null;
    }

    const capture = new Capture({ ...data, id: randomUUID(), capturedAt: new Date() });
    this.captures.set(capture.id, capture);
    return capture;
  }

  async findByTrainerId(trainerId: string): Promise<Capture[]> {
    return Array.from(this.captures.values()).filter((c) => c.trainerId === trainerId);
  }

  async countByTrainerId(trainerId: string): Promise<number> {
    return (await this.findByTrainerId(trainerId)).length;
  }

  async findById(id: string): Promise<Capture | null> {
    return this.captures.get(id) ?? null;
  }

  async updateNickname(id: string, nickname: string | null): Promise<Capture> {
    const capture = this.captures.get(id);

    if (!capture) {
      throw new Error(`Captura ${id} não encontrada.`);
    }

    capture.nickname = nickname ?? undefined;
    return capture;
  }

  async delete(id: string): Promise<void> {
    this.captures.delete(id);
  }
}
