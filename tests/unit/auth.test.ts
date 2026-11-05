import { beforeEach, describe, expect, it } from 'vitest';

import { AuthTokensIssuer } from '@application/services/AuthTokensIssuer';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase';
import { RefreshSessionUseCase } from '@application/use-cases/auth/RefreshSessionUseCase';
import { CreateTrainerUseCase } from '@application/use-cases/trainer/CreateTrainerUseCase';
import { InvalidCredentialsError } from '@domain/errors/InvalidCredentialsError';
import { TrainerEmailAlreadyInUseError } from '@domain/errors/TrainerEmailAlreadyInUseError';
import { UnauthorizedError } from '@domain/errors/UnauthorizedError';
import { InMemoryRefreshTokenRepository } from '@infrastructure/repositories/InMemoryRefreshTokenRepository';
import { InMemoryTrainerRepository } from '@infrastructure/repositories/InMemoryTrainerRepository';

import { FakePasswordHasher, FakeTokenService } from '../support/fakes';

describe('Autenticação', () => {
  let trainers: InMemoryTrainerRepository;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let tokenService: FakeTokenService;
  let register: CreateTrainerUseCase;
  let login: LoginUseCase;
  let refresh: RefreshSessionUseCase;
  let logout: LogoutUseCase;

  beforeEach(async () => {
    trainers = new InMemoryTrainerRepository();
    refreshTokens = new InMemoryRefreshTokenRepository();
    tokenService = new FakeTokenService();
    const hasher = new FakePasswordHasher();
    const issuer = new AuthTokensIssuer(tokenService, refreshTokens);

    register = new CreateTrainerUseCase(trainers, hasher);
    login = new LoginUseCase(trainers, hasher, issuer);
    refresh = new RefreshSessionUseCase(refreshTokens, trainers, tokenService, issuer);
    logout = new LogoutUseCase(refreshTokens, tokenService);

    await register.execute({ name: 'Ash', email: 'ash@test.com', password: 'pikachu123' });
  });

  describe('cadastro', () => {
    it('guarda só o hash da senha e sempre com papel TRAINER', async () => {
      const trainer = await register.execute({
        name: 'Misty',
        email: 'misty@test.com',
        password: 'togepi123',
      });

      expect(trainer.role).toBe('TRAINER');
      expect(trainer.passwordHash).toBe('hashed:togepi123');
    });

    it('recusa e-mail já cadastrado', async () => {
      await expect(
        register.execute({ name: 'Outro Ash', email: 'ash@test.com', password: 'pikachu123' }),
      ).rejects.toBeInstanceOf(TrainerEmailAlreadyInUseError);
    });
  });

  describe('login', () => {
    it('emite access token e refresh token', async () => {
      const result = await login.execute({ email: 'ash@test.com', password: 'pikachu123' });

      expect(result.tokenType).toBe('Bearer');
      expect(tokenService.verifyAccessToken(result.accessToken)).toEqual({
        trainerId: result.trainer.id,
        role: 'TRAINER',
      });
      expect(await refreshTokens.findByHash(`sha:${result.refreshToken}`)).not.toBeNull();
    });

    it('senha errada e e-mail inexistente dão o mesmo erro', async () => {
      await expect(
        login.execute({ email: 'ash@test.com', password: 'errada' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
      await expect(
        login.execute({ email: 'nao@existe.com', password: 'pikachu123' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });

  describe('refresh token', () => {
    it('troca o token e revoga o antigo (rotação)', async () => {
      const { refreshToken } = await login.execute({
        email: 'ash@test.com',
        password: 'pikachu123',
      });

      const next = await refresh.execute(refreshToken);

      expect(next.refreshToken).not.toBe(refreshToken);
      expect((await refreshTokens.findByHash(`sha:${refreshToken}`))?.revokedAt).toBeInstanceOf(
        Date,
      );
    });

    it('reuso de token revogado encerra todas as sessões', async () => {
      const { refreshToken } = await login.execute({
        email: 'ash@test.com',
        password: 'pikachu123',
      });
      const next = await refresh.execute(refreshToken);

      await expect(refresh.execute(refreshToken)).rejects.toBeInstanceOf(UnauthorizedError);
      await expect(refresh.execute(next.refreshToken)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('token desconhecido é recusado', async () => {
      await expect(refresh.execute('inventado')).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('logout revoga o token', async () => {
      const { refreshToken } = await login.execute({
        email: 'ash@test.com',
        password: 'pikachu123',
      });

      await logout.execute(refreshToken);

      await expect(refresh.execute(refreshToken)).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});
