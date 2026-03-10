import { z } from 'zod';

export const createDealDto = z.object({
  listingId: z.string().uuid(),
  message: z.string().optional(),
});

export const respondToDealDto = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

export const completeDealDto = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED']),
});

export type CreateDealDto = z.infer<typeof createDealDto>;
export type RespondToDealDto = z.infer<typeof respondToDealDto>;
export type CompleteDealDto = z.infer<typeof completeDealDto>;
