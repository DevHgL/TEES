import { Role, Trainer } from '@domain/entities/Trainer';
import { ForbiddenError } from '@domain/errors/ForbiddenError';
import { TrainerNotFoundError } from '@domain/errors/TrainerNotFoundError';
import { ITrainerRepository } from '@domain/repositories/ITrainerRepository';

export interface ChangeTrainerRoleInput {
  actorId: string;
  targetId: string;
  role: Role;
}

/**
 * Regras (RBAC):
 *  - só GYM_LEADER e ADMIN alteram perfis;
 *  - ninguém altera o próprio perfil (evita auto-promoção);
 *  - só ADMIN concede o papel ADMIN ou altera o perfil de outro ADMIN.
 */
export class ChangeTrainerRoleUseCase {
  constructor(private readonly trainerRepository: ITrainerRepository) {}

  async execute({ actorId, targetId, role }: ChangeTrainerRoleInput): Promise<Trainer> {
    const actor = await this.trainerRepository.findById(actorId);

    if (!actor?.canManageRoles()) {
      throw new ForbiddenError('Apenas GYM_LEADER ou ADMIN podem alterar perfis.');
    }

    if (actorId === targetId) {
      throw new ForbiddenError('Você não pode alterar o seu próprio perfil.');
    }

    const target = await this.trainerRepository.findById(targetId);

    if (!target) {
      throw new TrainerNotFoundError(targetId);
    }

    if ((role === 'ADMIN' || target.role === 'ADMIN') && actor.role !== 'ADMIN') {
      throw new ForbiddenError('Apenas ADMIN pode conceder ou retirar o papel ADMIN.');
    }

    return this.trainerRepository.updateRole(targetId, role);
  }
}
