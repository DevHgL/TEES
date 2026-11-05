import { CapturePokemonUseCase } from '@application/use-cases/trainer/CapturePokemonUseCase';
import { DeleteAccountUseCase } from '@application/use-cases/trainer/DeleteAccountUseCase';
import { GetTrainerByIdUseCase } from '@application/use-cases/trainer/GetTrainerByIdUseCase';
import { GetTrainerTeamUseCase } from '@application/use-cases/trainer/GetTrainerTeamUseCase';
import { ReleasePokemonUseCase } from '@application/use-cases/trainer/ReleasePokemonUseCase';

import { MeController } from '@infrastructure/http/controllers/MeController';
import { PrismaCaptureRepository } from '@infrastructure/repositories/PrismaCaptureRepository';
import { PrismaTrainerRepository } from '@infrastructure/repositories/PrismaTrainerRepository';

import { prisma } from '@main/config/database';
import { passwordHasher, refreshTokenCookie } from '@main/factories/authProviders.factory';
import { makePokeApiGateway } from '@main/factories/pokeApiGateway.factory';

export function makeMeController(): MeController {
  const trainerRepository = new PrismaTrainerRepository(prisma);
  const captureRepository = new PrismaCaptureRepository(prisma);

  return new MeController(
    new GetTrainerByIdUseCase(trainerRepository),
    new GetTrainerTeamUseCase(trainerRepository, captureRepository),
    new CapturePokemonUseCase(trainerRepository, captureRepository, makePokeApiGateway()),
    new ReleasePokemonUseCase(captureRepository),
    new DeleteAccountUseCase(trainerRepository, passwordHasher),
    refreshTokenCookie,
  );
}
