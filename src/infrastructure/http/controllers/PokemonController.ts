import { Request, Response } from 'express';

import { CreatePokemonUseCase } from '@application/use-cases/pokemon/CreatePokemonUseCase';
import { DeletePokemonUseCase } from '@application/use-cases/pokemon/DeletePokemonUseCase';
import { GetPokemonByIdUseCase } from '@application/use-cases/pokemon/GetPokemonByIdUseCase';
import { ListPokemonsUseCase } from '@application/use-cases/pokemon/ListPokemonsUseCase';
import { UpdatePokemonUseCase } from '@application/use-cases/pokemon/UpdatePokemonUseCase';

import {
  createPokemonSchema,
  listPokemonsQuerySchema,
  pokemonIdParamSchema,
  updatePokemonSchema,
} from '@infrastructure/http/validators/pokemon.schemas';

export class PokemonController {
  constructor(
    private readonly listPokemonsUseCase: ListPokemonsUseCase,
    private readonly getPokemonByIdUseCase: GetPokemonByIdUseCase,
    private readonly createPokemonUseCase: CreatePokemonUseCase,
    private readonly updatePokemonUseCase: UpdatePokemonUseCase,
    private readonly deletePokemonUseCase: DeletePokemonUseCase,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { type, name, page, limit } = listPokemonsQuerySchema.parse(req.query);
    const result = await this.listPokemonsUseCase.execute({ type, name }, { page, limit });
    res.status(200).json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = pokemonIdParamSchema.parse(req.params);
    const pokemon = await this.getPokemonByIdUseCase.execute(id);
    res.status(200).json(pokemon);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const data = createPokemonSchema.parse(req.body);
    const pokemon = await this.createPokemonUseCase.execute(data);
    res.status(201).json(pokemon);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = pokemonIdParamSchema.parse(req.params);
    const data = updatePokemonSchema.parse(req.body);
    const pokemon = await this.updatePokemonUseCase.execute(id, data);
    res.status(200).json(pokemon);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = pokemonIdParamSchema.parse(req.params);
    await this.deletePokemonUseCase.execute(id);
    res.status(204).send();
  };
}
