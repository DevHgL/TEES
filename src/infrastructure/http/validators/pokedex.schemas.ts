import { z } from 'zod';

/** Nome de espécie no formato aceito pela PokéAPI (ex: pikachu, mr-mime, porygon2). */
export const pokemonNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'informe o nome do Pokémon')
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'use apenas letras, números e hífen');

export const searchPokedexQuerySchema = z.object({
  name: pokemonNameSchema,
});
