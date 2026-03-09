import prisma from '../../lib/prisma';
import { CreateRequestDto, UpdateRequestDto } from './requests.dto';

const requestInclude = {
  user: { select: { id: true, name: true, city: true } },
  school: true,
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
  if (request.status !== 'OPEN') throw new Error('Only open requests can be updated');

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

/**
 * Given an approved listing, find open requests that match by board, class, and city.
 * If the listing has a price, only return requests where maxPrice is null or >= listing price.
 * Returns matching requests so the caller can handle notifications.
 */
export async function checkRequestMatches(listing: {
  board: string;
  class: number;
  city: string;
  price?: number | null;
}) {
  const where: any = {
    board: listing.board,
    class: listing.class,
    city: listing.city,
    status: 'OPEN',
  };

  const requests = await prisma.request.findMany({
    where,
    include: requestInclude,
  });

  // Filter by maxPrice on the application side if the listing has a price
  if (listing.price != null) {
    return requests.filter(
      (r) => r.maxPrice == null || r.maxPrice >= listing.price!
    );
  }

  return requests;
}
