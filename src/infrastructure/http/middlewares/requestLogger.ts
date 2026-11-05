import { randomUUID } from 'node:crypto';
import { IncomingMessage } from 'node:http';

import { RequestHandler } from 'express';
import { Logger } from 'pino';
import { pinoHttp } from 'pino-http';

const REQUEST_ID_HEADER = 'x-request-id';

/** Dentro de um Router o Express reescreve req.url; originalUrl guarda a rota completa. */
const fullUrl = (req: IncomingMessage): string =>
  (req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url ?? '';

/**
 * Um log por requisição (método, rota, status e tempo de resposta), com um ID de
 * correlação devolvido no cabeçalho X-Request-Id: o cliente informa o ID e o erro
 * correspondente é encontrado nos logs.
 */
export function requestLogger(logger: Logger): RequestHandler {
  return pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incoming = req.headers[REQUEST_ID_HEADER];
      const id =
        typeof incoming === 'string' && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res, responseTime) =>
      `${req.method} ${fullUrl(req)} ${res.statusCode} ${Math.round(responseTime)}ms`,
    customErrorMessage: (req, res) => `${req.method} ${fullUrl(req)} ${res.statusCode}`,
    // Healthchecks do Docker e do Render rodam a cada poucos segundos: não poluem o log.
    autoLogging: { ignore: (req) => req.url === '/api/health' },
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url, ip: req.remoteAddress }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  });
}
