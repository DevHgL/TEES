import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '@domain/errors/AppError';

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

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // JSON malformado no corpo da requisição (lançado pelo express.json()).
  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'JSON inválido no corpo da requisição.' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor.' });
}
