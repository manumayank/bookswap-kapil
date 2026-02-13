import { z } from 'zod';

const boardEnum = z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']);
const conditionEnum = z.enum(['UNUSED', 'ALMOST_NEW', 'WATER_MARKS', 'UNDERLINED']);
const exchangeEnum = z.enum(['PICKUP', 'SCHOOL', 'PORTER']);

export const createListingDto = z.object({
  listingType: z.enum(['SET', 'INDIVIDUAL']),
  board: boardEnum,
  class: z.number().int().min(1).max(12),
  schoolId: z.string().uuid().optional(),
  city: z.string().min(2),
  yearOfPurchase: z.number().int().optional(),
  condition: conditionEnum,
  exchangePreference: z.array(exchangeEnum).min(1, 'Select at least one exchange preference'),
  items: z.array(
    z.object({
      subject: z.string().min(1),
      title: z.string().optional(),
      publisher: z.string().optional(),
      condition: conditionEnum.optional(),
    })
  ).min(1, 'At least one book item is required'),
});

export const updateListingDto = z.object({
  condition: conditionEnum.optional(),
  exchangePreference: z.array(exchangeEnum).optional(),
  yearOfPurchase: z.number().int().optional(),
});

export const searchListingsDto = z.object({
  board: boardEnum.optional(),
  class: z.coerce.number().int().min(1).max(12).optional(),
  city: z.string().optional(),
  schoolId: z.string().uuid().optional(),
  condition: conditionEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateListingDto = z.infer<typeof createListingDto>;
export type UpdateListingDto = z.infer<typeof updateListingDto>;
export type SearchListingsDto = z.infer<typeof searchListingsDto>;
