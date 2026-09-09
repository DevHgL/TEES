export interface PokemonBaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface PokemonProps {
  id: string;
  name: string;
  types: string[];
  baseStats: PokemonBaseStats;
  imageUrl?: string;
}

export class Pokemon {
  readonly id: string;
  name: string;
  types: string[];
  baseStats: PokemonBaseStats;
  imageUrl?: string;

  constructor(props: PokemonProps) {
    this.id = props.id;
    this.name = props.name;
    this.types = props.types;
    this.baseStats = props.baseStats;
    this.imageUrl = props.imageUrl;
  }
}
