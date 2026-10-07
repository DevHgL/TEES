import { Trainer } from '@domain/entities/Trainer';

export interface CreateTrainerData {
  name: string;
  email: string;
}

export interface ITrainerRepository {
  findAll(): Promise<Trainer[]>;
  findById(id: string): Promise<Trainer | null>;
  findByEmail(email: string): Promise<Trainer | null>;
  create(data: CreateTrainerData): Promise<Trainer>;
}
