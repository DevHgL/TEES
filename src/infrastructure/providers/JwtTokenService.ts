import { createHash, randomBytes } from 'node:crypto';

import jwt from 'jsonwebtoken';

import { AccessTokenPayload, ITokenService } from '@application/ports/ITokenService';
import { ROLES, Role } from '@domain/entities/Trainer';

const ISSUER = 'pokemanager-api';
const AUDIENCE = 'pokemanager-clients';

export class JwtTokenService implements ITokenService {
  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlMs: number;

  constructor(
    private readonly secret: string,
    accessTokenTtlMinutes: number,
    refreshTokenTtlDays: number,
  ) {
    this.accessTokenTtlSeconds = accessTokenTtlMinutes * 60;
    this.refreshTokenTtlMs = refreshTokenTtlDays * 24 * 60 * 60 * 1000;
  }

  generateAccessToken({ trainerId, role }: AccessTokenPayload): string {
    return jwt.sign({ role }, this.secret, {
      subject: trainerId,
      expiresIn: this.accessTokenTtlSeconds,
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithm: 'HS256',
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      // algorithms fixo: impede o ataque de trocar o algoritmo do token (ex: "none").
      const payload = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: ISSUER,
        audience: AUDIENCE,
      });

      if (typeof payload === 'string' || !payload.sub || !isRole(payload['role'])) {
        return null;
      }

      return { trainerId: payload.sub, role: payload['role'] };
    } catch {
      return null;
    }
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
