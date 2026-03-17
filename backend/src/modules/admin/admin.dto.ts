import { z } from 'zod';

export const rejectListingDto = z.object({
  reason: z.string().optional(),
});

export const createSchoolDto = z.object({
  name: z.string().min(1, 'School name is required'),
  city: z.string().min(1, 'City is required'),
  board: z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']),
  address: z.string().optional(),
});

export const updateSchoolDto = z.object({
  name: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  board: z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']).optional(),
  address: z.string().optional(),
});
