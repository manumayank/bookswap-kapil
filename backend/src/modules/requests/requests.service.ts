import prisma from '../../lib/prisma';
import { CreateRequestDto, UpdateRequestDto } from './requests.dto';

const requestInclude = {
  user: { select: { id: true, name: true, city: true } },
  school: true,
  matches: {
    include: {
      listing: { include: { items: true, user: { select: { id: true, name: true } } } },
    },
  },
};

export async function createRequest(userId: string, data: CreateRequestDto) {
  return prisma.request.create({
    data: { ...data, userId },
    include: requestInclude,
  });
}

export async function getMyRequests(userId: string) {
  return prisma.request.findMany({
    where: { userId },
    include: requestInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateRequest(userId: string, id: string, data: UpdateRequestDto) {
  const request = await prisma.request.findFirst({ where: { id, userId } });
  if (!request) throw new Error('Request not found');

  return prisma.request.update({
    where: { id },
    data,
    include: requestInclude,
  });
}

export async function cancelRequest(userId: string, id: string) {
  const request = await prisma.request.findFirst({ where: { id, userId } });
  if (!request) throw new Error('Request not found');

  return prisma.request.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: requestInclude,
  });
}

export async function floatRequest(userId: string, id: string) {
  const request = await prisma.request.findFirst({ where: { id, userId } });
  if (!request) throw new Error('Request not found');

  return prisma.request.update({
    where: { id },
    data: { isFloated: true },
    include: requestInclude,
  });
}
