import { beforeEach, describe, expect, it } from 'vitest';

import { ReleasePokemonUseCase } from '@application/use-cases/trainer/ReleasePokemonUseCase';
import { CaptureNotFoundError } from '@domain/errors/CaptureNotFoundError';
import { ForbiddenError } from '@domain/errors/ForbiddenError';
import { InMemoryCaptureRepository } from '@infrastructure/repositories/InMemoryCaptureRepository';

import { makePokedexEntry } from '../support/fakes';

describe('ReleasePokemonUseCase', () => {
  let captures: InMemoryCaptureRepository;
  let sut: ReleasePokemonUseCase;
  let captureId: string;

  beforeEach(async () => {
    captures = new InMemoryCaptureRepository();
    sut = new ReleasePokemonUseCase(captures);
    const { pokedexNumber, name, types, baseStats } = makePokedexEntry('pikachu');
    const capture = await captures.createWithinTeamLimit(
      { trainerId: 'ash', pokedexNumber, name, types, baseStats },
      6,
    );
    captureId = capture!.id;
  });

  it('o dono solta o Pokémon', async () => {
    await sut.execute({ trainerId: 'ash', captureId });
    expect(await captures.findById(captureId)).toBeNull();
  });

  it('outro treinador não pode soltar', async () => {
    await expect(sut.execute({ trainerId: 'gary', captureId })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(await captures.findById(captureId)).not.toBeNull();
  });

  it('captura inexistente', async () => {
    await expect(sut.execute({ trainerId: 'ash', captureId: 'nada' })).rejects.toBeInstanceOf(
      CaptureNotFoundError,
    );
  });
});
