import { z } from 'zod';

const boardEnum = z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']);

export const createRequestDto = z.object({
  board: boardEnum,
  class: z.number().int().min(1).max(12),
  subjects: z.array(z.string()).default([]),
  schoolId: z.string().uuid().optional(),
  city: z.string().min(2),
  maxPrice: z.number().positive().optional(),
});

export const updateRequestDto = z.object({
  board: boardEnum.optional(),
  class: z.number().int().min(1).max(12).optional(),
  subjects: z.array(z.string()).optional(),
  schoolId: z.string().uuid().optional().nullable(),
  city: z.string().min(2).optional(),
  maxPrice: z.number().positive().optional().nullable(),
});

// For finding matches without creating a request
export const findMatchesDto = z.object({
  board: boardEnum.optional(),
  class: z.number().int().min(1).max(12).optional(),
  subjects: z.array(z.string()).optional().default([]),
  schoolId: z.string().uuid().optional(),
  city: z.string().min(2),
  maxPrice: z.number().positive().optional(),
});

export type CreateRequestDto = z.infer<typeof createRequestDto>;
export type UpdateRequestDto = z.infer<typeof updateRequestDto>;
export type FindMatchesDto = z.infer<typeof findMatchesDto>;
