import { beforeEach, describe, expect, it } from 'vitest';

import { ChangeTrainerRoleUseCase } from '@application/use-cases/trainer/ChangeTrainerRoleUseCase';
import { Role, Trainer } from '@domain/entities/Trainer';
import { ForbiddenError } from '@domain/errors/ForbiddenError';
import { TrainerNotFoundError } from '@domain/errors/TrainerNotFoundError';
import { InMemoryTrainerRepository } from '@infrastructure/repositories/InMemoryTrainerRepository';

describe('ChangeTrainerRoleUseCase (RBAC)', () => {
  let trainers: InMemoryTrainerRepository;
  let sut: ChangeTrainerRoleUseCase;

  const create = (name: string, role: Role): Promise<Trainer> =>
    trainers.create({ name, email: `${name}@test.com`, passwordHash: 'x', role });

  beforeEach(() => {
    trainers = new InMemoryTrainerRepository();
    sut = new ChangeTrainerRoleUseCase(trainers);
  });

  it('GYM_LEADER promove um TRAINER', async () => {
    const brock = await create('brock', 'GYM_LEADER');
    const ash = await create('ash', 'TRAINER');

    const updated = await sut.execute({ actorId: brock.id, targetId: ash.id, role: 'GYM_LEADER' });
    expect(updated.role).toBe('GYM_LEADER');
  });

  it('TRAINER não altera perfis', async () => {
    const ash = await create('ash', 'TRAINER');
    const gary = await create('gary', 'TRAINER');

    await expect(
      sut.execute({ actorId: ash.id, targetId: gary.id, role: 'GYM_LEADER' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('ninguém altera o próprio perfil', async () => {
    const brock = await create('brock', 'GYM_LEADER');

    await expect(
      sut.execute({ actorId: brock.id, targetId: brock.id, role: 'ADMIN' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('só ADMIN concede o papel ADMIN', async () => {
    const brock = await create('brock', 'GYM_LEADER');
    const admin = await create('admin', 'ADMIN');
    const ash = await create('ash', 'TRAINER');

    await expect(
      sut.execute({ actorId: brock.id, targetId: ash.id, role: 'ADMIN' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      sut.execute({ actorId: admin.id, targetId: ash.id, role: 'ADMIN' }),
    ).resolves.toMatchObject({
      role: 'ADMIN',
    });
  });

  it('GYM_LEADER não rebaixa um ADMIN', async () => {
    const brock = await create('brock', 'GYM_LEADER');
    const admin = await create('admin', 'ADMIN');

    await expect(
      sut.execute({ actorId: brock.id, targetId: admin.id, role: 'TRAINER' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('alvo inexistente', async () => {
    const admin = await create('admin', 'ADMIN');

    await expect(
      sut.execute({ actorId: admin.id, targetId: 'nada', role: 'TRAINER' }),
    ).rejects.toBeInstanceOf(TrainerNotFoundError);
  });
});
