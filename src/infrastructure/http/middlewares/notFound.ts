import { Request, Response } from 'express';

/** Rotas inexistentes da API respondem JSON (e não a página HTML padrão do Express). */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({ message: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}
