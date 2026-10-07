import { IStatsRepository, Stats } from '@domain/repositories/IStatsRepository';

export class GetStatsUseCase {
  /** Quantidade de itens nos rankings. */
  private static readonly RANKING_SIZE = 5;

  constructor(private readonly statsRepository: IStatsRepository) {}

  async execute(): Promise<Stats> {
    return this.statsRepository.getStats(GetStatsUseCase.RANKING_SIZE);
  }
}
