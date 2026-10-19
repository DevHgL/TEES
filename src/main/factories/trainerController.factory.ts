import { CapturePokemonUseCase } from '@application/use-cases/trainer/CapturePokemonUseCase';
import { ChangeTrainerRoleUseCase } from '@application/use-cases/trainer/ChangeTrainerRoleUseCase';
import { CreateTrainerUseCase } from '@application/use-cases/trainer/CreateTrainerUseCase';
import { GetTrainerTeamUseCase } from '@application/use-cases/trainer/GetTrainerTeamUseCase';
import { ListTrainersUseCase } from '@application/use-cases/trainer/ListTrainersUseCase';

import { TrainerController } from '@infrastructure/http/controllers/TrainerController';
import { PrismaCaptureRepository } from '@infrastructure/repositories/PrismaCaptureRepository';
import { PrismaTrainerRepository } from '@infrastructure/repositories/PrismaTrainerRepository';

import { prisma } from '@main/config/database';
import { passwordHasher } from '@main/factories/authProviders.factory';
import { makePokeApiGateway } from '@main/factories/pokeApiGateway.factory';

export function makeTrainerController(): TrainerController {
  const trainerRepository = new PrismaTrainerRepository(prisma);
  const captureRepository = new PrismaCaptureRepository(prisma);

  return new TrainerController(
    new CreateTrainerUseCase(trainerRepository, passwordHasher),
    new CapturePokemonUseCase(trainerRepository, captureRepository, makePokeApiGateway()),
    new GetTrainerTeamUseCase(trainerRepository, captureRepository),
    new ListTrainersUseCase(trainerRepository),
    new ChangeTrainerRoleUseCase(trainerRepository),
  );
}
