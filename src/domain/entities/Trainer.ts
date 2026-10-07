export interface TrainerProps {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class Trainer {
  /** Regra de negócio: um treinador pode ter no máximo 6 Pokémons no time ativo. */
  static readonly MAX_TEAM_SIZE = 6;

  readonly id: string;
  name: string;
  email: string;
  readonly createdAt: Date;

  constructor(props: TrainerProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.createdAt = props.createdAt;
  }
}
