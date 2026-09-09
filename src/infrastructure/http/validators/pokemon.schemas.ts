import { z } from 'zod';

export const baseStatsSchema = z.object({
  hp: z.number().int().nonnegative(),
  attack: z.number().int().nonnegative(),
  defense: z.number().int().nonnegative(),
  specialAttack: z.number().int().nonnegative(),
  specialDefense: z.number().int().nonnegative(),
  speed: z.number().int().nonnegative(),
});

export const createPokemonSchema = z.object({
  name: z.string().trim().min(1, 'name é obrigatório'),
  types: z.array(z.string().trim().min(1)).min(1, 'informe ao menos um type'),
  baseStats: baseStatsSchema,
  imageUrl: z.string().url().optional(),
});

export const updatePokemonSchema = createPokemonSchema.partial();

export const pokemonIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const listPokemonsQuerySchema = z.object({
  type: z.string().trim().min(1).optional(),
});

export type CreatePokemonInput = z.infer<typeof createPokemonSchema>;
export type UpdatePokemonInput = z.infer<typeof updatePokemonSchema>;
