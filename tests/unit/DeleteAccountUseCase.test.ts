import { beforeEach, describe, expect, it } from 'vitest';

import { DeleteAccountUseCase } from '@application/use-cases/trainer/DeleteAccountUseCase';
import { Role, Trainer } from '@domain/entities/Trainer';
import { ForbiddenError } from '@domain/errors/ForbiddenError';
import { TrainerNotFoundError } from '@domain/errors/TrainerNotFoundError';
import { InMemoryTrainerRepository } from '@infrastructure/repositories/InMemoryTrainerRepository';

import { FakePasswordHasher } from '../support/fakes';

describe('DeleteAccountUseCase', () => {
  let trainers: InMemoryTrainerRepository;
  let sut: DeleteAccountUseCase;

  const create = (name: string, role: Role = 'TRAINER'): Promise<Trainer> =>
    trainers.create({ name, email: `${name}@test.com`, passwordHash: 'hashed:senha123', role });

  beforeEach(() => {
    trainers = new InMemoryTrainerRepository();
    sut = new DeleteAccountUseCase(trainers, new FakePasswordHasher());
  });

  it('apaga a conta com a senha correta', async () => {
    const ash = await create('ash');

    await sut.execute({ trainerId: ash.id, password: 'senha123' });

    expect(await trainers.findById(ash.id)).toBeNull();
  });

  it('senha errada não apaga nada', async () => {
    const ash = await create('ash');

    await expect(sut.execute({ trainerId: ash.id, password: 'errada' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(await trainers.findById(ash.id)).not.toBeNull();
  });

  it('o último ADMIN não pode se apagar, mas um ADMIN com outro ADMIN pode', async () => {
    const admin = await create('admin', 'ADMIN');

    await expect(sut.execute({ trainerId: admin.id, password: 'senha123' })).rejects.toThrow(
      /último ADMIN/,
    );

    await create('admin2', 'ADMIN');
    await sut.execute({ trainerId: admin.id, password: 'senha123' });
    expect(await trainers.findById(admin.id)).toBeNull();
  });

  it('treinador inexistente', async () => {
    await expect(sut.execute({ trainerId: 'nada', password: 'senha123' })).rejects.toBeInstanceOf(
      TrainerNotFoundError,
    );
  });
});
