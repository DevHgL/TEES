import { Request, Response } from 'express';

import { CapturePokemonUseCase } from '@application/use-cases/trainer/CapturePokemonUseCase';
import { DeleteAccountUseCase } from '@application/use-cases/trainer/DeleteAccountUseCase';
import { GetTrainerByIdUseCase } from '@application/use-cases/trainer/GetTrainerByIdUseCase';
import { GetTrainerTeamUseCase } from '@application/use-cases/trainer/GetTrainerTeamUseCase';
import { ReleasePokemonUseCase } from '@application/use-cases/trainer/ReleasePokemonUseCase';
import { RenameCaptureUseCase } from '@application/use-cases/trainer/RenameCaptureUseCase';
import { Trainer } from '@domain/entities/Trainer';

import { RefreshTokenCookie } from '@infrastructure/http/cookies/refreshTokenCookie';
import { getAuth } from '@infrastructure/http/middlewares/ensureAuthenticated';
import { toTrainerDTO } from '@infrastructure/http/presenters/trainerPresenter';
import {
  captureIdParamSchema,
  deleteAccountSchema,
} from '@infrastructure/http/validators/auth.schemas';
import {
  capturePokemonSchema,
  renameCaptureSchema,
} from '@infrastructure/http/validators/trainer.schemas';

/** Rotas do treinador autenticado: o ID vem sempre do token, nunca da URL ou do corpo. */
export class MeController {
  constructor(
    private readonly getTrainerByIdUseCase: GetTrainerByIdUseCase,
    private readonly getTrainerTeamUseCase: GetTrainerTeamUseCase,
    private readonly capturePokemonUseCase: CapturePokemonUseCase,
    private readonly releasePokemonUseCase: ReleasePokemonUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
    private readonly renameCaptureUseCase: RenameCaptureUseCase,
    private readonly refreshTokenCookie: RefreshTokenCookie,
  ) {}

  profile = async (req: Request, res: Response): Promise<void> => {
    const trainer = await this.getTrainerByIdUseCase.execute(getAuth(req).trainerId);
    res.status(200).json(toTrainerDTO(trainer));
  };

  team = async (req: Request, res: Response): Promise<void> => {
    const { trainerId } = getAuth(req);
    const team = await this.getTrainerTeamUseCase.execute(trainerId);
    res.status(200).json({
      trainerId,
      size: team.length,
      maxSize: Trainer.MAX_TEAM_SIZE,
      pokemons: team,
    });
  };

  catch = async (req: Request, res: Response): Promise<void> => {
    const { trainerId } = getAuth(req);
    const { pokemonName, nickname } = capturePokemonSchema.parse(req.body);
    const capture = await this.capturePokemonUseCase.execute({ trainerId, pokemonName, nickname });
    res.status(201).json(capture);
  };

  release = async (req: Request, res: Response): Promise<void> => {
    const { captureId } = captureIdParamSchema.parse(req.params);
    await this.releasePokemonUseCase.execute({ trainerId: getAuth(req).trainerId, captureId });
    res.status(204).send();
  };

  rename = async (req: Request, res: Response): Promise<void> => {
    const { captureId } = captureIdParamSchema.parse(req.params);
    const { nickname } = renameCaptureSchema.parse(req.body);
    const capture = await this.renameCaptureUseCase.execute({
      trainerId: getAuth(req).trainerId,
      captureId,
      nickname,
    });
    res.status(200).json(capture);
  };

  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    const { password } = deleteAccountSchema.parse(req.body);
    await this.deleteAccountUseCase.execute({ trainerId: getAuth(req).trainerId, password });
    // As sessões já foram apagadas no banco; o cookie também sai do navegador.
    this.refreshTokenCookie.clear(res);
    res.status(204).send();
  };
}
