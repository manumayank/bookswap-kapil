import { z } from 'zod';

export const searchSchoolsDto = z.object({
  name: z.string().optional(),
  city: z.string().optional(),
  board: z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const suggestSchoolDto = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters'),
  city: z.string().min(2, 'City is required'),
  board: z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']),
  address: z.string().optional(),
});

export type SearchSchoolsDto = z.infer<typeof searchSchoolsDto>;
export type SuggestSchoolDto = z.infer<typeof suggestSchoolDto>;
