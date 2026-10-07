import { z } from 'zod';

export const baseStatsSchema = z.object({
  hp: z.number().int().min(0).max(255),
  attack: z.number().int().min(0).max(255),
  defense: z.number().int().min(0).max(255),
  specialAttack: z.number().int().min(0).max(255),
  specialDefense: z.number().int().min(0).max(255),
  speed: z.number().int().min(0).max(255),
});

export const createPokemonSchema = z.object({
  name: z.string().trim().min(1, 'name é obrigatório'),
  types: z
    .array(z.string().trim().toLowerCase().min(1))
    .min(1, 'informe ao menos um type')
    .max(2, 'um Pokémon tem no máximo 2 types'),
  baseStats: baseStatsSchema,
  imageUrl: z.string().url().optional(),
});

export const updatePokemonSchema = createPokemonSchema.partial();

export const pokemonIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const listPokemonsQuerySchema = z.object({
  type: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePokemonInput = z.infer<typeof createPokemonSchema>;
export type UpdatePokemonInput = z.infer<typeof updatePokemonSchema>;
