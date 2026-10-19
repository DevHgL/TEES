import { z } from 'zod';

import { ROLES } from '@domain/entities/Trainer';

const emailSchema = z.string().trim().toLowerCase().email('email inválido');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'name é obrigatório').max(100),
  email: emailSchema,
  // bcrypt considera só os 72 primeiros bytes da senha, por isso o limite.
  password: z
    .string()
    .min(8, 'a senha deve ter pelo menos 8 caracteres')
    .max(72, 'a senha deve ter no máximo 72 caracteres')
    .regex(/[A-Za-z]/, 'a senha deve ter ao menos uma letra')
    .regex(/[0-9]/, 'a senha deve ter ao menos um número'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'password é obrigatório').max(72),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken é obrigatório').max(200),
});

export const changeRoleSchema = z.object({
  role: z.enum(ROLES),
});

export const captureIdParamSchema = z.object({
  captureId: z.string().uuid('captureId inválido'),
});
