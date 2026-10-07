import { Prisma } from '@infrastructure/database/generated/prisma/client';

/** P2025: registro alvo de update/delete não encontrado. */
export function isRecordNotFoundError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}

/** P2002: violação de restrição de unicidade. */
export function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}
