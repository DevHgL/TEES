import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@infrastructure/database/generated/prisma/client';

import { env } from '@main/config/env';

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.databaseUrl }),
});
