import { z } from 'zod';

const boardEnum = z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']);
const typeEnum = z.enum(['Annual Exam', 'Half Yearly', 'Unit Test', 'Pre-Board', 'Olympiad', 'Quiz']);

export const createPaperDto = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  board: boardEnum,
  class: z.number().int().min(1).max(12),
  year: z.number().int().min(2010).max(2030),
  type: typeEnum,
  schoolId: z.string().uuid().optional(),
});

export const searchPapersDto = z.object({
  board: boardEnum.optional(),
  class: z.coerce.number().int().min(1).max(12).optional(),
  subject: z.string().optional(),
  year: z.coerce.number().int().optional(),
  type: typeEnum.optional(),
  schoolId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreatePaperDto = z.infer<typeof createPaperDto>;
export type SearchPapersDto = z.infer<typeof searchPapersDto>;
