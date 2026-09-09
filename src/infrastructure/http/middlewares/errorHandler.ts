import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { PokemonNotFoundError } from '@domain/errors/PokemonNotFoundError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Dados inválidos.',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof PokemonNotFoundError) {
    res.status(404).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor.' });
}
