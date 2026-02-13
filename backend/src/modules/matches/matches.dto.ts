import { z } from 'zod';

export const scheduleMatchDto = z.object({
  exchangeMethod: z.enum(['PICKUP', 'SCHOOL', 'PORTER']),
  exchangeDate: z.string().datetime().optional(),
  exchangeLocation: z.string().optional(),
});

export type ScheduleMatchDto = z.infer<typeof scheduleMatchDto>;
