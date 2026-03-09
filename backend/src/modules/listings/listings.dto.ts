import { z } from 'zod';

const boardEnum = z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']);
const categoryEnum = z.enum(['BOOK', 'STATIONERY']);
const conditionEnum = z.enum([
  'HARDLY_USED',
  'WELL_MAINTAINED',
  'MARKER_USED',
  'STAINS',
  'TORN_PAGES',
]);

export const createListingDto = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  category: categoryEnum,
  board: boardEnum.optional(),
  class: z.number().int().min(1).max(12).optional(),
  subject: z.string().max(100).optional(),
  schoolId: z.string().uuid().optional(),
  city: z.string().min(2).max(100),
  buyingPrice: z.number().positive().optional(),
  sellingPrice: z.number().positive('Selling price is required'),
  condition: conditionEnum,
  yearOfPurchase: z.number().int().min(2000).max(2030).optional(),
});

export const updateListingDto = createListingDto.partial();

export const searchListingsDto = z.object({
  search: z.string().optional(),
  category: categoryEnum.optional(),
  board: boardEnum.optional(),
  class: z.coerce.number().int().min(1).max(12).optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateListingDto = z.infer<typeof createListingDto>;
export type UpdateListingDto = z.infer<typeof updateListingDto>;
export type SearchListingsDto = z.infer<typeof searchListingsDto>;
