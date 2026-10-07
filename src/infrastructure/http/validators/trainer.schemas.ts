import { z } from 'zod';

import { pokemonNameSchema } from '@infrastructure/http/validators/pokedex.schemas';

export const createTrainerSchema = z.object({
  name: z.string().trim().min(1, 'name é obrigatório').max(100),
  email: z.string().trim().toLowerCase().email('email inválido'),
});

export const trainerIdParamSchema = z.object({
  trainerId: z.string().uuid('trainerId inválido'),
});

export const capturePokemonSchema = z.object({
  pokemonName: pokemonNameSchema,
  nickname: z.string().trim().min(1).max(30).optional(),
});
