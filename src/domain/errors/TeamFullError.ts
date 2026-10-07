import { AppError } from '@domain/errors/AppError';
import { Trainer } from '@domain/entities/Trainer';

export class TeamFullError extends AppError {
  constructor() {
    super(`O time ativo já possui o máximo de ${Trainer.MAX_TEAM_SIZE} Pokémons.`, 422);
  }
}
