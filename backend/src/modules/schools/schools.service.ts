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

/**
 * Find or create a school by name, city, and board
 * This allows crowd-sourcing the school database
 */
export async function findOrCreateSchool(
  name: string,
  city: string,
  board: string
) {
  if (!name || !city || !board) {
    return null;
  }

  // Try to find existing school (case insensitive)
  const existingSchool = await prisma.school.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      city: { equals: city, mode: 'insensitive' },
      board: board as any,
    },
  });

  if (existingSchool) {
    return existingSchool;
  }

  // Create new school if not found
  const newSchool = await prisma.school.create({
    data: {
      name: name.trim(),
      city: city.trim(),
      board: board as any,
      isVerified: false, // Mark as unverified since it was auto-created
    },
  });

  console.log(`Auto-created new school: ${newSchool.name} (${newSchool.city})`);
  return newSchool;
}
