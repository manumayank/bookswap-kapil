import prisma from '../../lib/prisma';
import { SearchSchoolsDto, SuggestSchoolDto } from './schools.dto';
import { Prisma } from '@prisma/client';

export async function searchSchools(query: SearchSchoolsDto) {
  const { name, city, board, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.SchoolWhereInput = {};
  if (name) where.name = { contains: name, mode: 'insensitive' };
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (board) where.board = board;

  const [schools, total] = await Promise.all([
    prisma.school.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
    prisma.school.count({ where }),
  ]);

  return { schools, total, page, limit };
}

export async function getSchool(id: string) {
  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) throw new Error('School not found');
  return school;
}

export async function suggestSchool(data: SuggestSchoolDto) {
  return prisma.school.create({
    data: { ...data, isVerified: false },
  });
}
