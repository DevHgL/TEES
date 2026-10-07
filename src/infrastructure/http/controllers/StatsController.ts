import { Request, Response } from 'express';

import { GetStatsUseCase } from '@application/use-cases/stats/GetStatsUseCase';

export class StatsController {
  constructor(private readonly getStatsUseCase: GetStatsUseCase) {}

  get = async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.getStatsUseCase.execute();
    res.status(200).json(stats);
  };
}
