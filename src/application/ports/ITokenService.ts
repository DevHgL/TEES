import { Role } from '@domain/entities/Trainer';

export interface AccessTokenPayload {
  trainerId: string;
  role: Role;
}

export interface ITokenService {
  generateAccessToken(payload: AccessTokenPayload): string;
  /** Retorna `null` se o token for inválido, adulterado ou expirado. */
  verifyAccessToken(token: string): AccessTokenPayload | null;
  /** Validade do access token, em segundos. */
  readonly accessTokenTtlSeconds: number;

  /** Refresh token opaco (aleatório), não um JWT. */
  generateRefreshToken(): string;
  /** Hash determinístico do refresh token, que é o que fica salvo no banco. */
  hashRefreshToken(token: string): string;
  readonly refreshTokenTtlMs: number;
}
