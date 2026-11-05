import { RequestHandler } from 'express';

export interface DeprecationOptions {
  /** Data em que a rota foi descontinuada. */
  since: Date;
  /** Rota que a substitui. */
  successor: string;
}

/**
 * Marca uma rota como descontinuada sem quebrá-la: ela continua funcionando, mas a resposta
 * avisa o cliente pelos cabeçalhos padronizados `Deprecation` (RFC 9745) e
 * `Link: <...>; rel="successor-version"` (RFC 8288), além de registrar o uso no log.
 */
export function deprecated({ since, successor }: DeprecationOptions): RequestHandler {
  const deprecationHeader = `@${Math.floor(since.getTime() / 1000)}`;
  const linkHeader = `<${successor}>; rel="successor-version"`;

  return (req, res, next) => {
    res.setHeader('Deprecation', deprecationHeader);
    res.append('Link', linkHeader);
    req.log?.warn({ successor }, `Rota descontinuada: ${req.method} ${req.originalUrl}`);
    next();
  };
}
