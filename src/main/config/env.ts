import { z } from 'zod';

/**
 * Variáveis de ambiente validadas com Zod no startup: se algo estiver faltando ou
 * inválido, o servidor nem sobe e mostra exatamente qual variável corrigir.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL de conexão do PostgreSQL'),

  POKEAPI_BASE_URL: z.string().url().default('https://pokeapi.co/api/v2'),
  POKEDEX_CACHE_TTL_HOURS: z.coerce.number().positive().default(168),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),

  /** Origens liberadas no CORS, separadas por vírgula. Vazio = só a própria origem. */
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),

  /** Nível mínimo dos logs. Nos testes, o padrão é não logar nada. */
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const vars = parsed.data;

export const env = {
  nodeEnv: vars.NODE_ENV,
  isProduction: vars.NODE_ENV === 'production',
  port: vars.PORT,
  databaseUrl: vars.DATABASE_URL,
  pokeApiBaseUrl: vars.POKEAPI_BASE_URL,
  pokedexCacheTtlHours: vars.POKEDEX_CACHE_TTL_HOURS,
  jwtSecret: vars.JWT_SECRET,
  jwtExpiresInMinutes: vars.JWT_EXPIRES_IN_MINUTES,
  refreshTokenTtlDays: vars.REFRESH_TOKEN_TTL_DAYS,
  bcryptRounds: vars.BCRYPT_ROUNDS,
  corsOrigins: vars.CORS_ORIGINS,
  rateLimitWindowMinutes: vars.RATE_LIMIT_WINDOW_MINUTES,
  rateLimitMax: vars.RATE_LIMIT_MAX,
  loginRateLimitMax: vars.LOGIN_RATE_LIMIT_MAX,
  logLevel: vars.LOG_LEVEL ?? (vars.NODE_ENV === 'test' ? 'silent' : 'info'),
};
