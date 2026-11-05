import { randomUUID } from 'node:crypto';

import { Role, Trainer } from '@domain/entities/Trainer';
import { CreateTrainerData, ITrainerRepository } from '@domain/repositories/ITrainerRepository';

export class InMemoryTrainerRepository implements ITrainerRepository {
  private readonly trainers = new Map<string, Trainer>();

  async findAll(): Promise<Trainer[]> {
    return Array.from(this.trainers.values());
  }

  async findById(id: string): Promise<Trainer | null> {
    return this.trainers.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<Trainer | null> {
    return Array.from(this.trainers.values()).find((t) => t.email === email) ?? null;
  }

  async create(data: CreateTrainerData): Promise<Trainer> {
    const trainer = new Trainer({
      id: randomUUID(),
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? 'TRAINER',
      createdAt: new Date(),
    });

    this.trainers.set(trainer.id, trainer);
    return trainer;
  }

  async updateRole(id: string, role: Role): Promise<Trainer> {
    const trainer = this.trainers.get(id);

    if (!trainer) {
      throw new Error(`Treinador ${id} não encontrado.`);
    }

    trainer.role = role;
    return trainer;
  }
}
