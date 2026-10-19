export const ROLES = ['TRAINER', 'GYM_LEADER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export interface TrainerProps {
  id: string;
  name: string;
  email: string;
  /** Hash da senha. Ausente só em treinadores criados antes da autenticação existir. */
  passwordHash?: string;
  role: Role;
  createdAt: Date;
}

export class Trainer {
  /** Regra de negócio: um treinador pode ter no máximo 6 Pokémons no time ativo. */
  static readonly MAX_TEAM_SIZE = 6;

  readonly id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  readonly createdAt: Date;

  constructor(props: TrainerProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.createdAt = props.createdAt;
  }

  /** Líderes de ginásio e administradores podem gerenciar perfis de acesso. */
  canManageRoles(): boolean {
    return this.role === 'GYM_LEADER' || this.role === 'ADMIN';
  }
}
