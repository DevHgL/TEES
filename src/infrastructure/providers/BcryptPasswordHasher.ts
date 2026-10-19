import bcrypt from 'bcryptjs';

import { IPasswordHasher } from '@application/ports/IPasswordHasher';

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly rounds: number) {}

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
