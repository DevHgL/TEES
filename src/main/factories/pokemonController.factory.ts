import { CreatePokemonUseCase } from '@application/use-cases/pokemon/CreatePokemonUseCase';
import { DeletePokemonUseCase } from '@application/use-cases/pokemon/DeletePokemonUseCase';
import { GetPokemonByIdUseCase } from '@application/use-cases/pokemon/GetPokemonByIdUseCase';
import { ListPokemonsUseCase } from '@application/use-cases/pokemon/ListPokemonsUseCase';
import { UpdatePokemonUseCase } from '@application/use-cases/pokemon/UpdatePokemonUseCase';

import { PokemonController } from '@infrastructure/http/controllers/PokemonController';
import { PrismaPokemonRepository } from '@infrastructure/repositories/PrismaPokemonRepository';

import { prisma } from '@main/config/database';

export function makePokemonController(): PokemonController {
  const pokemonRepository = new PrismaPokemonRepository(prisma);

  return new PokemonController(
    new ListPokemonsUseCase(pokemonRepository),
    new GetPokemonByIdUseCase(pokemonRepository),
    new CreatePokemonUseCase(pokemonRepository),
    new UpdatePokemonUseCase(pokemonRepository),
    new DeletePokemonUseCase(pokemonRepository),
  );
}
