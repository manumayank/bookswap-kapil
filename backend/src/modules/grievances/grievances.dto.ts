import { z } from 'zod';

export const createGrievanceDto = z.object({
  subject: z.string().min(3).max(120),
  description: z.string().min(10).max(4000),
  transactionCode: z.string().optional(),
});
export type CreateGrievanceDto = z.infer<typeof createGrievanceDto>;

export const updateGrievanceStatusDto = z.object({
  status: z.enum(['OPEN', 'RESOLVED', 'DISMISSED']),
});
export type UpdateGrievanceStatusDto = z.infer<typeof updateGrievanceStatusDto>;
