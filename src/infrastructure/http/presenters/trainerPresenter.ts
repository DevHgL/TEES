import { Role, Trainer } from '@domain/entities/Trainer';

/** O que a API expõe de um treinador. Nunca inclui o hash da senha. */
export interface TrainerDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

/** Versão pública (ex: ranking), sem e-mail. */
export type PublicTrainerDTO = Omit<TrainerDTO, 'email'>;

export function toTrainerDTO(trainer: Trainer): TrainerDTO {
  return {
    id: trainer.id,
    name: trainer.name,
    email: trainer.email,
    role: trainer.role,
    createdAt: trainer.createdAt,
  };
}
