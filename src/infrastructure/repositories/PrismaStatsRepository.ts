import {
  CapturesByType,
  IStatsRepository,
  MostCapturedPokemon,
  Stats,
  StatsTotals,
  TrainerRanking,
} from '@domain/repositories/IStatsRepository';

import { Prisma, PrismaClient } from '@infrastructure/database/generated/prisma/client';

/**
 * Estatísticas calculadas no próprio PostgreSQL com SQL de agregação.
 * COUNT/SUM retornam bigint no Postgres, por isso os casts para ::int.
 */
export class PrismaStatsRepository implements IStatsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getStats(limit: number): Promise<Stats> {
    // REPEATABLE READ: todas as consultas enxergam o mesmo snapshot do banco, então os
    // números são consistentes entre si mesmo com capturas acontecendo em paralelo.
    const [totals, mostCaptured, capturesByType, topTrainers] = await this.prisma.$transaction(
      [
        this.prisma.$queryRaw<StatsTotals[]>`
          SELECT
            (SELECT COUNT(*) FROM trainers)::int      AS "trainers",
            (SELECT COUNT(*) FROM captures)::int      AS "captures",
            (SELECT COUNT(*) FROM pokemons)::int      AS "catalogPokemons",
            (SELECT COUNT(*) FROM pokedex_cache)::int AS "cachedPokedexEntries",
            COALESCE((
              SELECT ROUND(AVG(team_size), 2)
              FROM (
                SELECT COUNT(c.id) AS team_size
                FROM trainers t
                LEFT JOIN captures c ON c.trainer_id = t.id
                GROUP BY t.id
              ) AS teams
            ), 0)::float8 AS "averageTeamSize"`,

        this.prisma.$queryRaw<
          (Omit<MostCapturedPokemon, 'imageUrl'> & { imageUrl: string | null })[]
        >`
          SELECT
            pokedex_number  AS "pokedexNumber",
            name,
            MAX(image_url)  AS "imageUrl",
            COUNT(*)::int   AS "timesCaptured"
          FROM captures
          GROUP BY pokedex_number, name
          ORDER BY "timesCaptured" DESC, pokedex_number
          LIMIT ${limit}`,

        // unnest() "explode" o array de tipos: um Pokémon fire/flying conta para os dois.
        this.prisma.$queryRaw<CapturesByType[]>`
          SELECT type, COUNT(*)::int AS "count"
          FROM captures, unnest(types) AS type
          GROUP BY type
          ORDER BY "count" DESC, type`,

        this.prisma.$queryRaw<TrainerRanking[]>`
          SELECT
            t.id,
            t.name,
            COUNT(c.id)::int AS "teamSize",
            COALESCE(SUM(
              c.hp + c.attack + c.defense + c.special_attack + c.special_defense + c.speed
            ), 0)::int AS "totalBaseStats"
          FROM trainers t
          LEFT JOIN captures c ON c.trainer_id = t.id
          GROUP BY t.id, t.name
          ORDER BY "totalBaseStats" DESC, t.name
          LIMIT ${limit}`,
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    return {
      totals: totals[0]!,
      mostCaptured: mostCaptured.map((p) => ({ ...p, imageUrl: p.imageUrl ?? undefined })),
      capturesByType,
      topTrainers,
    };
  }
}
