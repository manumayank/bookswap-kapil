import prisma from '../../lib/prisma';
import { CreateRequestDto, UpdateRequestDto, FindMatchesDto } from './requests.dto';

const requestInclude = {
  user: { select: { id: true, name: true, city: true } },
  school: true,
};

const listingInclude = {
  images: true,
  items: true,
  user: { select: { id: true, name: true, city: true } },
  school: { select: { id: true, name: true, city: true, board: true } },
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
 * Find matching listings for given criteria (without creating a request)
 * Used for "Preview matches" before raising a request
 */
export async function findMatchesForCriteria(data: FindMatchesDto) {
  const { board, class: classNum, subjects, schoolId, city, maxPrice } = data;

  const where: any = {
    status: 'ACTIVE',
    city: { contains: city, mode: 'insensitive' },
  };

  if (board) where.board = board;
  if (classNum) where.class = classNum;
  if (schoolId) where.schoolId = schoolId;
  
  if (maxPrice !== undefined) {
    where.sellingPrice = { lte: maxPrice };
  }

  // If subjects are specified, filter listings that have items matching those subjects
  let listings = await prisma.listing.findMany({
    where,
    include: listingInclude,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Filter by subjects if specified (check if listing has items with matching subjects)
  if (subjects && subjects.length > 0) {
    listings = listings.filter(listing => {
      if (!listing.items || listing.items.length === 0) return true; // Include if no specific items
      return listing.items.some(item => 
        subjects.some(sub => 
          item.subject.toLowerCase().includes(sub.toLowerCase())
        )
      );
    });
  }

  return listings;
}

/**
 * Get matching listings for an existing request
 */
export async function getMatchesForRequest(userId: string, requestId: string) {
  const request = await prisma.request.findFirst({
    where: { id: requestId, userId },
  });
  
  if (!request) throw new Error('Request not found');

  const where: any = {
    status: 'ACTIVE',
    city: { contains: request.city, mode: 'insensitive' },
    userId: { not: userId }, // Don't show own listings
  };

  if (request.board) where.board = request.board;
  if (request.class) where.class = request.class;
  if (request.schoolId) where.schoolId = request.schoolId;
  if (request.maxPrice !== null) {
    where.sellingPrice = { lte: request.maxPrice };
  }

  let listings = await prisma.listing.findMany({
    where,
    include: listingInclude,
    orderBy: { createdAt: 'desc' },
  });

  // Filter by subjects if specified
  if (request.subjects && request.subjects.length > 0) {
    listings = listings.filter(listing => {
      if (!listing.items || listing.items.length === 0) return true;
      return listing.items.some(item => 
        request.subjects.some(sub => 
          item.subject.toLowerCase().includes(sub.toLowerCase())
        )
      );
    });
  }

  return { request, listings };
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
