import { beforeEach, describe, expect, it } from 'vitest';

import { CapturePokemonUseCase } from '@application/use-cases/trainer/CapturePokemonUseCase';
import { Trainer } from '@domain/entities/Trainer';
import { PokedexEntryNotFoundError } from '@domain/errors/PokedexEntryNotFoundError';
import { TeamFullError } from '@domain/errors/TeamFullError';
import { TrainerNotFoundError } from '@domain/errors/TrainerNotFoundError';
import { InMemoryCaptureRepository } from '@infrastructure/repositories/InMemoryCaptureRepository';
import { InMemoryTrainerRepository } from '@infrastructure/repositories/InMemoryTrainerRepository';

import { FakePokeApiGateway } from '../support/fakes';

describe('CapturePokemonUseCase', () => {
  let trainers: InMemoryTrainerRepository;
  let captures: InMemoryCaptureRepository;
  let pokeApi: FakePokeApiGateway;
  let sut: CapturePokemonUseCase;
  let trainer: Trainer;

  beforeEach(async () => {
    trainers = new InMemoryTrainerRepository();
    captures = new InMemoryCaptureRepository();
    pokeApi = new FakePokeApiGateway([
      'pikachu',
      'charmander',
      'squirtle',
      'bulbasaur',
      'eevee',
      'snorlax',
      'mew',
    ]);
    sut = new CapturePokemonUseCase(trainers, captures, pokeApi);
    trainer = await trainers.create({ name: 'Ash', email: 'ash@test.com', passwordHash: 'x' });
  });

  it('salva a captura com os dados oficiais da PokéAPI', async () => {
    const capture = await sut.execute({
      trainerId: trainer.id,
      pokemonName: 'Pikachu',
      nickname: 'Pika',
    });

    expect(capture).toMatchObject({
      trainerId: trainer.id,
      name: 'pikachu',
      nickname: 'Pika',
      types: ['electric'],
      baseStats: expect.objectContaining({ hp: 35, speed: 90 }),
    });
    expect(await captures.countByTrainerId(trainer.id)).toBe(1);
  });

  it(`permite até ${Trainer.MAX_TEAM_SIZE} Pokémons e recusa o 7º`, async () => {
    for (const name of ['pikachu', 'charmander', 'squirtle', 'bulbasaur', 'eevee', 'snorlax']) {
      await sut.execute({ trainerId: trainer.id, pokemonName: name });
    }

    await expect(sut.execute({ trainerId: trainer.id, pokemonName: 'mew' })).rejects.toBeInstanceOf(
      TeamFullError,
    );
    expect(await captures.countByTrainerId(trainer.id)).toBe(Trainer.MAX_TEAM_SIZE);
  });

  it('não consulta a PokéAPI quando o time já está cheio', async () => {
    for (let i = 0; i < Trainer.MAX_TEAM_SIZE; i++) {
      await sut.execute({ trainerId: trainer.id, pokemonName: 'pikachu' });
    }
    const callsBefore = pokeApi.calls;

    await expect(sut.execute({ trainerId: trainer.id, pokemonName: 'mew' })).rejects.toThrow(
      TeamFullError,
    );
    expect(pokeApi.calls).toBe(callsBefore);
  });

  it('o limite é por treinador', async () => {
    const misty = await trainers.create({
      name: 'Misty',
      email: 'misty@test.com',
      passwordHash: 'x',
    });
    for (let i = 0; i < Trainer.MAX_TEAM_SIZE; i++) {
      await sut.execute({ trainerId: trainer.id, pokemonName: 'pikachu' });
    }

    await expect(
      sut.execute({ trainerId: misty.id, pokemonName: 'squirtle' }),
    ).resolves.toBeDefined();
  });

  it('recusa treinador inexistente', async () => {
    await expect(
      sut.execute({ trainerId: '00000000-0000-0000-0000-000000000000', pokemonName: 'pikachu' }),
    ).rejects.toBeInstanceOf(TrainerNotFoundError);
  });

  it('recusa Pokémon que não existe na PokéAPI', async () => {
    await expect(
      sut.execute({ trainerId: trainer.id, pokemonName: 'digimon' }),
    ).rejects.toBeInstanceOf(PokedexEntryNotFoundError);
    expect(await captures.countByTrainerId(trainer.id)).toBe(0);
  });
});
