import { beforeEach, describe, expect, it } from 'vitest';

import { CreatePokemonUseCase } from '@application/use-cases/pokemon/CreatePokemonUseCase';
import { DeletePokemonUseCase } from '@application/use-cases/pokemon/DeletePokemonUseCase';
import { GetPokemonByIdUseCase } from '@application/use-cases/pokemon/GetPokemonByIdUseCase';
import { ListPokemonsUseCase } from '@application/use-cases/pokemon/ListPokemonsUseCase';
import { UpdatePokemonUseCase } from '@application/use-cases/pokemon/UpdatePokemonUseCase';
import { PokemonNotFoundError } from '@domain/errors/PokemonNotFoundError';
import { InMemoryPokemonRepository } from '@infrastructure/repositories/InMemoryPokemonRepository';

import { makePokedexEntry } from '../support/fakes';

describe('Catálogo de Pokémons', () => {
  let repository: InMemoryPokemonRepository;
  const { baseStats } = makePokedexEntry('pikachu');

  beforeEach(async () => {
    repository = new InMemoryPokemonRepository();
    const create = new CreatePokemonUseCase(repository);
    await create.execute({ name: 'Pikachu', types: ['electric'], baseStats });
    await create.execute({ name: 'Charmander', types: ['fire'], baseStats });
    await create.execute({ name: 'Charizard', types: ['fire', 'flying'], baseStats });
  });

  it('filtra por tipo e por nome, com paginação', async () => {
    const list = new ListPokemonsUseCase(repository);

    const fire = await list.execute({ type: 'FIRE' }, { page: 1, limit: 10 });
    expect(fire.data.map((p) => p.name)).toEqual(['Charmander', 'Charizard']);

    const byName = await list.execute({ name: 'char' }, { page: 1, limit: 1 });
    expect(byName).toMatchObject({ total: 2, totalPages: 2 });
    expect(byName.data).toHaveLength(1);
  });

  it('busca, atualiza e remove por ID', async () => {
    const [pikachu] = (await repository.findAll({ name: 'pikachu' }, { page: 1, limit: 1 })).data;

    expect(await new GetPokemonByIdUseCase(repository).execute(pikachu!.id)).toMatchObject({
      name: 'Pikachu',
    });

    const updated = await new UpdatePokemonUseCase(repository).execute(pikachu!.id, {
      name: 'Raichu',
    });
    expect(updated.name).toBe('Raichu');

    await new DeletePokemonUseCase(repository).execute(pikachu!.id);
    await expect(new GetPokemonByIdUseCase(repository).execute(pikachu!.id)).rejects.toBeInstanceOf(
      PokemonNotFoundError,
    );
  });

  it('ID inexistente gera PokemonNotFoundError', async () => {
    await expect(
      new UpdatePokemonUseCase(repository).execute('nada', { name: 'X' }),
    ).rejects.toBeInstanceOf(PokemonNotFoundError);
    await expect(new DeletePokemonUseCase(repository).execute('nada')).rejects.toBeInstanceOf(
      PokemonNotFoundError,
    );
  });
});
