import { GetStatsUseCase } from '@application/use-cases/stats/GetStatsUseCase';

import { StatsController } from '@infrastructure/http/controllers/StatsController';
import { PrismaStatsRepository } from '@infrastructure/repositories/PrismaStatsRepository';

import { prisma } from '@main/config/database';

export function makeStatsController(): StatsController {
  return new StatsController(new GetStatsUseCase(new PrismaStatsRepository(prisma)));
}
