import { randomUUID } from 'node:crypto';

import { Pokemon } from '@domain/entities/Pokemon';

export const pokemonSeed: Pokemon[] = [
  new Pokemon({
    id: randomUUID(),
    name: 'Pikachu',
    types: ['electric'],
    baseStats: {
      hp: 35,
      attack: 55,
      defense: 40,
      specialAttack: 50,
      specialDefense: 50,
      speed: 90,
    },
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  }),
  new Pokemon({
    id: randomUUID(),
    name: 'Charmander',
    types: ['fire'],
    baseStats: {
      hp: 39,
      attack: 52,
      defense: 43,
      specialAttack: 60,
      specialDefense: 50,
      speed: 65,
    },
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
  }),
  new Pokemon({
    id: randomUUID(),
    name: 'Squirtle',
    types: ['water'],
    baseStats: {
      hp: 44,
      attack: 48,
      defense: 65,
      specialAttack: 50,
      specialDefense: 64,
      speed: 43,
    },
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  }),
];
