import { z } from 'zod';

import { pokemonNameSchema } from '@infrastructure/http/validators/pokedex.schemas';

export const trainerIdParamSchema = z.object({
  trainerId: z.string().uuid('trainerId inválido'),
});

export const trainerIdSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const capturePokemonSchema = z.object({
  pokemonName: pokemonNameSchema,
  nickname: z.string().trim().min(1).max(30).optional(),
});
