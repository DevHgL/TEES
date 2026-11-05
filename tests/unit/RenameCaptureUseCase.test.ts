import { beforeEach, describe, expect, it } from 'vitest';

import { RenameCaptureUseCase } from '@application/use-cases/trainer/RenameCaptureUseCase';
import { CaptureNotFoundError } from '@domain/errors/CaptureNotFoundError';
import { ForbiddenError } from '@domain/errors/ForbiddenError';
import { InMemoryCaptureRepository } from '@infrastructure/repositories/InMemoryCaptureRepository';

import { makePokedexEntry } from '../support/fakes';

describe('RenameCaptureUseCase', () => {
  let captures: InMemoryCaptureRepository;
  let sut: RenameCaptureUseCase;
  let captureId: string;

  beforeEach(async () => {
    captures = new InMemoryCaptureRepository();
    sut = new RenameCaptureUseCase(captures);
    const { pokedexNumber, name, types, baseStats } = makePokedexEntry('pikachu');
    const capture = await captures.createWithinTeamLimit(
      { trainerId: 'ash', pokedexNumber, name, types, baseStats, nickname: 'Pika' },
      6,
    );
    captureId = capture!.id;
  });

  it('o dono troca e remove o apelido', async () => {
    expect((await sut.execute({ trainerId: 'ash', captureId, nickname: 'Sparky' })).nickname).toBe(
      'Sparky',
    );
    expect(
      (await sut.execute({ trainerId: 'ash', captureId, nickname: null })).nickname,
    ).toBeUndefined();
  });

  it('outro treinador não renomeia', async () => {
    await expect(
      sut.execute({ trainerId: 'gary', captureId, nickname: 'Roubado' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect((await captures.findById(captureId))?.nickname).toBe('Pika');
  });

  it('captura inexistente', async () => {
    await expect(
      sut.execute({ trainerId: 'ash', captureId: 'nada', nickname: 'X' }),
    ).rejects.toBeInstanceOf(CaptureNotFoundError);
  });
});
