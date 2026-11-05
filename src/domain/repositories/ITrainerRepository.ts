import { Role, Trainer } from '@domain/entities/Trainer';
import { Paginated, PaginationParams } from '@domain/repositories/Pagination';

export interface CreateTrainerData {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
}

export interface TrainerFilter {
  /** Busca parcial no nome ou no e-mail, sem diferenciar maiúsculas/minúsculas. */
  search?: string;
}

export interface ITrainerRepository {
  findAll(filter: TrainerFilter, pagination: PaginationParams): Promise<Paginated<Trainer>>;
  findById(id: string): Promise<Trainer | null>;
  findByEmail(email: string): Promise<Trainer | null>;
  create(data: CreateTrainerData): Promise<Trainer>;
  updateRole(id: string, role: Role): Promise<Trainer>;
  countByRole(role: Role): Promise<number>;
  /** Remove o treinador; as capturas e os refresh tokens dele são apagados em cascata. */
  delete(id: string): Promise<void>;
}
