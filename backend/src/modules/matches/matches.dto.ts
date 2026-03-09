import { z } from 'zod';

export const createDealDto = z.object({
  listingId: z.string().uuid(),
  offeredPrice: z.number().positive().optional(),
});

export type CreateDealDto = z.infer<typeof createDealDto>;
