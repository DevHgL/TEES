import { Request, Response } from 'express';

import { SearchPokedexUseCase } from '@application/use-cases/pokedex/SearchPokedexUseCase';

import { searchPokedexQuerySchema } from '@infrastructure/http/validators/pokedex.schemas';

export class PokedexController {
  constructor(private readonly searchPokedexUseCase: SearchPokedexUseCase) {}

  search = async (req: Request, res: Response): Promise<void> => {
    const { name } = searchPokedexQuerySchema.parse(req.query);
    const entry = await this.searchPokedexUseCase.execute(name);
    res.status(200).json(entry);
  };
}
