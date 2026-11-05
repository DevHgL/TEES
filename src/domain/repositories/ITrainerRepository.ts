import { Role, Trainer } from '@domain/entities/Trainer';

export interface CreateTrainerData {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
}

export interface ITrainerRepository {
  findAll(): Promise<Trainer[]>;
  findById(id: string): Promise<Trainer | null>;
  findByEmail(email: string): Promise<Trainer | null>;
  create(data: CreateTrainerData): Promise<Trainer>;
  updateRole(id: string, role: Role): Promise<Trainer>;
  countByRole(role: Role): Promise<number>;
  /** Remove o treinador; as capturas e os refresh tokens dele são apagados em cascata. */
  delete(id: string): Promise<void>;
}
