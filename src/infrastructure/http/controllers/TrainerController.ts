import { Request, Response } from 'express';

import { CapturePokemonUseCase } from '@application/use-cases/trainer/CapturePokemonUseCase';
import { CreateTrainerUseCase } from '@application/use-cases/trainer/CreateTrainerUseCase';
import { GetTrainerTeamUseCase } from '@application/use-cases/trainer/GetTrainerTeamUseCase';
import { ListTrainersUseCase } from '@application/use-cases/trainer/ListTrainersUseCase';
import { Trainer } from '@domain/entities/Trainer';

import {
  capturePokemonSchema,
  createTrainerSchema,
  trainerIdParamSchema,
} from '@infrastructure/http/validators/trainer.schemas';

export class TrainerController {
  constructor(
    private readonly createTrainerUseCase: CreateTrainerUseCase,
    private readonly capturePokemonUseCase: CapturePokemonUseCase,
    private readonly getTrainerTeamUseCase: GetTrainerTeamUseCase,
    private readonly listTrainersUseCase: ListTrainersUseCase,
  ) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const trainers = await this.listTrainersUseCase.execute();
    res.status(200).json(trainers);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const data = createTrainerSchema.parse(req.body);
    const trainer = await this.createTrainerUseCase.execute(data);
    res.status(201).json(trainer);
  };

  capture = async (req: Request, res: Response): Promise<void> => {
    const { trainerId } = trainerIdParamSchema.parse(req.params);
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
}
