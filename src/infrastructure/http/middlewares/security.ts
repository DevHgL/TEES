import cors from 'cors';
import { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';

export interface SecurityOptions {
  isProduction: boolean;
  corsOrigins: string[];
  rateLimitWindowMinutes: number;
  rateLimitMax: number;
  loginRateLimitMax: number;
}

/** Helmet: cabeçalhos HTTP de segurança (CSP, X-Frame-Options, HSTS, nosniff...). */
export function securityHeaders({ isProduction }: SecurityOptions): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        // Sprites dos Pokémons vêm do repositório oficial da PokéAPI no GitHub.
        imgSrc: ["'self'", 'data:', 'https://raw.githubusercontent.com'],
        // Em desenvolvimento (http://localhost) não forçamos HTTPS.
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    // HSTS só faz sentido (e só é respeitado) sob HTTPS, ou seja, em produção.
    strictTransportSecurity: isProduction,
  });
}

/** CORS: só origens da lista. O frontend em / é a mesma origem e não depende disso. */
export function corsPolicy({ corsOrigins }: SecurityOptions): RequestHandler {
  return cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
}

/** Limite geral de requisições por IP, para toda a API. */
export function apiRateLimit(options: SecurityOptions): RequestHandler {
  return rateLimit({
    windowMs: options.rateLimitWindowMinutes * 60 * 1000,
    limit: options.rateLimitMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Muitas requisições. Tente novamente em alguns minutos.' },
  });
}

/**
 * Limite rígido no login contra força bruta: só tentativas que FALHAM contam, então um
 * usuário legítimo que acerta a senha não é bloqueado.
 */
export function loginRateLimit(options: SecurityOptions): RequestHandler {
  return rateLimit({
    windowMs: options.rateLimitWindowMinutes * 60 * 1000,
    limit: options.loginRateLimitMax,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      message: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
    },
  });
}
