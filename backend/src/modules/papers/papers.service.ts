import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { CreatePaperDto, SearchPapersDto } from './papers.dto';

const paperInclude = {
  uploadedBy: { select: { id: true, name: true } },
  school: { select: { id: true, name: true } },
};

export async function createPaper(userId: string, data: CreatePaperDto, fileUrl: string) {
  return prisma.paper.create({
    data: {
      ...data,
      fileUrl,
      uploadedById: userId,
      downloadCount: 0,
    },
    include: paperInclude,
  });
}

export async function searchPapers(query: SearchPapersDto) {
  const { board, class: classNum, subject, year, type, schoolId, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.PaperWhereInput = {};
  
  if (board) where.board = board;
  if (classNum) where.class = classNum;
  if (subject) where.subject = { contains: subject, mode: 'insensitive' };
  if (year) where.year = year;
  if (type) where.type = type;
  if (schoolId) where.schoolId = schoolId;

  const [papers, total] = await Promise.all([
    prisma.paper.findMany({
      where,
      skip,
      take: limit,
      include: paperInclude,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.paper.count({ where }),
  ]);

  return { papers, total, page, limit };
}

export async function getPaperById(id: string) {
  const paper = await prisma.paper.findUnique({
    where: { id },
    include: paperInclude,
  });
  
  if (!paper) throw new Error('Paper not found');
  return paper;
}

export async function incrementDownloadCount(id: string) {
  return prisma.paper.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
    include: paperInclude,
  });
}
