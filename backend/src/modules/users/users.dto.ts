import { z } from 'zod';

const boardEnum = z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']);

export const registerUserDto = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  city: z.string().min(2, 'City is required'),
  address: z.string().optional(),
  schoolId: z.string().uuid().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  schoolName: z.string().optional(), // For auto-creating schools
  board: boardEnum.optional(),
});

export const updateUserDto = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  city: z.string().min(2).optional(),
  address: z.string().optional(),
  schoolId: z.string().uuid().optional(),
  board: boardEnum.optional(),
});

export const addChildDto = z.object({
  name: z.string().optional(),
  gender: z.string().optional(),
  currentClass: z.number().int().min(1).max(12),
  schoolId: z.string().uuid().optional(),
});

export const updateChildDto = addChildDto.partial();

export type RegisterUserDto = z.infer<typeof registerUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
export type AddChildDto = z.infer<typeof addChildDto>;
export type UpdateChildDto = z.infer<typeof updateChildDto>;
