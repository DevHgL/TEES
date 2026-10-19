import { IPasswordHasher } from '@application/ports/IPasswordHasher';
import { AuthTokens, AuthTokensIssuer } from '@application/services/AuthTokensIssuer';
import { Trainer } from '@domain/entities/Trainer';
import { InvalidCredentialsError } from '@domain/errors/InvalidCredentialsError';
import { ITrainerRepository } from '@domain/repositories/ITrainerRepository';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput extends AuthTokens {
  trainer: Trainer;
}

export class LoginUseCase {
  /** Hash de uma senha qualquer, com o mesmo custo, usado quando o e-mail não existe. */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly trainerRepository: ITrainerRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokensIssuer: AuthTokensIssuer,
  ) {}

  async execute({ email, password }: LoginInput): Promise<LoginOutput> {
    const trainer = await this.trainerRepository.findByEmail(email);

    // Compara sempre, mesmo sem treinador: o tempo de resposta fica igual e não dá para
    // descobrir quais e-mails estão cadastrados medindo a demora (timing attack).
    const passwordMatches = await this.passwordHasher.compare(
      password,
      trainer?.passwordHash ?? (await this.getDummyHash()),
    );

    if (!trainer?.passwordHash || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return { ...(await this.tokensIssuer.issue(trainer)), trainer };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.passwordHasher.hash('senha-inexistente');
    return this.dummyHash;
  }
}
