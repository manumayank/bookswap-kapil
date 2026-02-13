import { z } from 'zod';

const boardEnum = z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']);
const conditionEnum = z.enum(['UNUSED', 'ALMOST_NEW', 'WATER_MARKS', 'UNDERLINED']);

export const createRequestDto = z.object({
  board: boardEnum,
  class: z.number().int().min(1).max(12),
  subjects: z.array(z.string()).default([]),
  schoolId: z.string().uuid().optional(),
  city: z.string().min(2),
  minCondition: conditionEnum.optional(),
});

export const updateRequestDto = z.object({
  subjects: z.array(z.string()).optional(),
  minCondition: conditionEnum.optional(),
});

export type CreateRequestDto = z.infer<typeof createRequestDto>;
export type UpdateRequestDto = z.infer<typeof updateRequestDto>;
