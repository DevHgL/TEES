import { Request, Response } from 'express';

import { CapturePokemonUseCase } from '@application/use-cases/trainer/CapturePokemonUseCase';
import { ChangeTrainerRoleUseCase } from '@application/use-cases/trainer/ChangeTrainerRoleUseCase';
import { CreateTrainerUseCase } from '@application/use-cases/trainer/CreateTrainerUseCase';
import { GetTrainerTeamUseCase } from '@application/use-cases/trainer/GetTrainerTeamUseCase';
import { ListTrainersUseCase } from '@application/use-cases/trainer/ListTrainersUseCase';
import { Trainer } from '@domain/entities/Trainer';
import { ForbiddenError } from '@domain/errors/ForbiddenError';

import { getAuth } from '@infrastructure/http/middlewares/ensureAuthenticated';
import { toTrainerDTO } from '@infrastructure/http/presenters/trainerPresenter';
import { changeRoleSchema, registerSchema } from '@infrastructure/http/validators/auth.schemas';
import {
  capturePokemonSchema,
  listTrainersQuerySchema,
  trainerIdParamSchema,
  trainerIdSchema,
} from '@infrastructure/http/validators/trainer.schemas';

export class TrainerController {
  constructor(
    private readonly createTrainerUseCase: CreateTrainerUseCase,
    private readonly capturePokemonUseCase: CapturePokemonUseCase,
    private readonly getTrainerTeamUseCase: GetTrainerTeamUseCase,
    private readonly listTrainersUseCase: ListTrainersUseCase,
    private readonly changeTrainerRoleUseCase: ChangeTrainerRoleUseCase,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { search, page, limit } = listTrainersQuerySchema.parse(req.query);
    const result = await this.listTrainersUseCase.execute({ search }, { page, limit });
    res.status(200).json({ ...result, data: result.data.map(toTrainerDTO) });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const data = registerSchema.parse(req.body);
    const trainer = await this.createTrainerUseCase.execute(data);
    res.status(201).json(toTrainerDTO(trainer));
  };

  capture = async (req: Request, res: Response): Promise<void> => {
    const { trainerId } = trainerIdParamSchema.parse(req.params);
    const auth = getAuth(req);

    // Controle de acesso: só o próprio treinador (ou um ADMIN) captura para este time.
    if (auth.trainerId !== trainerId && auth.role !== 'ADMIN') {
      throw new ForbiddenError('Você só pode capturar Pokémons para o seu próprio time.');
    }

    const { pokemonName, nickname } = capturePokemonSchema.parse(req.body);
    const capture = await this.capturePokemonUseCase.execute({ trainerId, pokemonName, nickname });
    res.status(201).json(capture);
  };

  team = async (req: Request, res: Response): Promise<void> => {
    const { trainerId } = trainerIdParamSchema.parse(req.params);
    const team = await this.getTrainerTeamUseCase.execute(trainerId);
    res.status(200).json({
      trainerId,
      size: team.length,
      maxSize: Trainer.MAX_TEAM_SIZE,
      pokemons: team,
    });
  };

  changeRole = async (req: Request, res: Response): Promise<void> => {
    const { id } = trainerIdSchema.parse(req.params);
    const { role } = changeRoleSchema.parse(req.body);
    const trainer = await this.changeTrainerRoleUseCase.execute({
      actorId: getAuth(req).trainerId,
      targetId: id,
      role,
    });
    res.status(200).json(toTrainerDTO(trainer));
  };
}
