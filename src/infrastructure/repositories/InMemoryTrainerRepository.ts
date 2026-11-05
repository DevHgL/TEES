import { randomUUID } from 'node:crypto';

import { Role, Trainer } from '@domain/entities/Trainer';
import {
  CreateTrainerData,
  ITrainerRepository,
  TrainerFilter,
} from '@domain/repositories/ITrainerRepository';
import { Paginated, PaginationParams } from '@domain/repositories/Pagination';

export class InMemoryTrainerRepository implements ITrainerRepository {
  private readonly trainers = new Map<string, Trainer>();

  async findAll(
    { search }: TrainerFilter,
    { page, limit }: PaginationParams,
  ): Promise<Paginated<Trainer>> {
    const term = search?.toLowerCase();
    const matches = Array.from(this.trainers.values()).filter(
      (t) => !term || t.name.toLowerCase().includes(term) || t.email.toLowerCase().includes(term),
    );

    return {
      data: matches.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: matches.length,
      totalPages: Math.ceil(matches.length / limit),
    };
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

  async countByRole(role: Role): Promise<number> {
    return Array.from(this.trainers.values()).filter((t) => t.role === role).length;
  }

  async delete(id: string): Promise<void> {
    this.trainers.delete(id);
  }
}
