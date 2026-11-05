import { z } from 'zod';

import { pokemonNameSchema } from '@infrastructure/http/validators/pokedex.schemas';

export const trainerIdParamSchema = z.object({
  trainerId: z.string().uuid('trainerId inválido'),
});

export const trainerIdSchema = z.object({
  id: z.string().uuid('id inválido'),
});

const nicknameSchema = z.string().trim().min(1, 'apelido não pode ser vazio').max(30);

export const capturePokemonSchema = z.object({
  pokemonName: pokemonNameSchema,
  nickname: nicknameSchema.optional(),
});

/** `null` remove o apelido (o Pokémon volta a aparecer com o nome da espécie). */
export const renameCaptureSchema = z.object({
  nickname: nicknameSchema.nullable(),
});

export const listTrainersQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
