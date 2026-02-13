import prisma from '../../lib/prisma';
import { BookCondition, Prisma } from '@prisma/client';
import { ScheduleMatchDto } from './matches.dto';

const matchInclude = {
  listing: {
    include: {
      items: true,
      images: true,
      user: { select: { id: true, name: true, city: true, phone: true } },
      school: true,
    },
  },
  request: {
    include: {
      user: { select: { id: true, name: true, city: true, phone: true } },
      school: true,
    },
  },
  giver: { select: { id: true, name: true, city: true, phone: true } },
  receiver: { select: { id: true, name: true, city: true, phone: true } },
};

const CONDITION_ORDER: BookCondition[] = ['UNUSED', 'ALMOST_NEW', 'WATER_MARKS', 'UNDERLINED'];

function meetsCondition(listingCondition: BookCondition, minCondition?: BookCondition | null): boolean {
  if (!minCondition) return true;
  return CONDITION_ORDER.indexOf(listingCondition) <= CONDITION_ORDER.indexOf(minCondition);
}

/**
 * Auto-match: find matching listings for a request.
 * Priority: 1) Same school+class+board, 2) Same city+class+board, 3) Same city+class
 */
export async function autoMatchForRequest(requestId: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request) return [];

  // Find active listings that match
  const baseWhere: Prisma.ListingWhereInput = {
    status: 'ACTIVE',
    class: request.class,
    userId: { not: request.userId }, // Don't match own listings
  };

  // Priority 1: Same school + class + board
  const tier1 = request.schoolId
    ? await prisma.listing.findMany({
        where: { ...baseWhere, schoolId: request.schoolId, board: request.board },
        include: { user: true },
      })
    : [];

  // Priority 2: Same city + class + board
  const tier2 = await prisma.listing.findMany({
    where: { ...baseWhere, city: { equals: request.city, mode: 'insensitive' }, board: request.board },
    include: { user: true },
  });

  // Priority 3: Same city + class (any board)
  const tier3 = await prisma.listing.findMany({
    where: { ...baseWhere, city: { equals: request.city, mode: 'insensitive' } },
    include: { user: true },
  });

  // Deduplicate and filter by condition
  const seen = new Set<string>();
  const allListings = [...tier1, ...tier2, ...tier3].filter((listing) => {
    if (seen.has(listing.id)) return false;
    seen.add(listing.id);
    return meetsCondition(listing.condition, request.minCondition);
  });

  // Create matches
  const matches = [];
  for (const listing of allListings) {
    // Check if match already exists
    const existing = await prisma.match.findFirst({
      where: { listingId: listing.id, requestId: request.id },
    });
    if (existing) continue;

    const match = await prisma.match.create({
      data: {
        listingId: listing.id,
        requestId: request.id,
        giverId: listing.userId,
        receiverId: request.userId,
      },
      include: matchInclude,
    });
    matches.push(match);
  }

  // Update request status if matches found
  if (matches.length > 0) {
    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'MATCHED' },
    });
  }

  return matches;
}

/** Auto-match: find matching requests for a new listing */
export async function autoMatchForListing(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { user: true },
  });
  if (!listing) return [];

  const baseWhere: Prisma.RequestWhereInput = {
    status: { in: ['OPEN', 'MATCHED'] },
    class: listing.class,
    userId: { not: listing.userId },
  };

  // Also match floated requests
  const requests = await prisma.request.findMany({
    where: {
      ...baseWhere,
      OR: [
        { city: { equals: listing.city, mode: 'insensitive' } },
        { schoolId: listing.schoolId ?? undefined },
      ],
    },
  });

  const matches = [];
  for (const request of requests) {
    if (!meetsCondition(listing.condition, request.minCondition)) continue;

    const existing = await prisma.match.findFirst({
      where: { listingId: listing.id, requestId: request.id },
    });
    if (existing) continue;

    const match = await prisma.match.create({
      data: {
        listingId: listing.id,
        requestId: request.id,
        giverId: listing.userId,
        receiverId: request.userId,
      },
      include: matchInclude,
    });
    matches.push(match);

    // Update request status
    await prisma.request.update({
      where: { id: request.id },
      data: { status: 'MATCHED' },
    });
  }

  return matches;
}

export async function getMyMatches(userId: string) {
  return prisma.match.findMany({
    where: {
      OR: [{ giverId: userId }, { receiverId: userId }],
    },
    include: matchInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function acceptMatch(userId: string, matchId: string) {
  const match = await prisma.match.findFirst({
    where: { id: matchId, OR: [{ giverId: userId }, { receiverId: userId }] },
  });
  if (!match) throw new Error('Match not found');

  return prisma.match.update({
    where: { id: matchId },
    data: { status: 'ACCEPTED' },
    include: matchInclude,
  });
}

export async function rejectMatch(userId: string, matchId: string) {
  const match = await prisma.match.findFirst({
    where: { id: matchId, OR: [{ giverId: userId }, { receiverId: userId }] },
  });
  if (!match) throw new Error('Match not found');

  return prisma.match.update({
    where: { id: matchId },
    data: { status: 'REJECTED' },
    include: matchInclude,
  });
}

export async function scheduleExchange(userId: string, matchId: string, data: ScheduleMatchDto) {
  const match = await prisma.match.findFirst({
    where: { id: matchId, status: 'ACCEPTED', OR: [{ giverId: userId }, { receiverId: userId }] },
  });
  if (!match) throw new Error('Match not found or not accepted');

  return prisma.match.update({
    where: { id: matchId },
    data: {
      exchangeMethod: data.exchangeMethod,
      exchangeDate: data.exchangeDate ? new Date(data.exchangeDate) : undefined,
      exchangeLocation: data.exchangeLocation,
    },
    include: matchInclude,
  });
}

export async function completeMatch(userId: string, matchId: string) {
  const match = await prisma.match.findFirst({
    where: { id: matchId, status: 'ACCEPTED', OR: [{ giverId: userId }, { receiverId: userId }] },
  });
  if (!match) throw new Error('Match not found or not accepted');

  // Update match status
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { status: 'COMPLETED' },
    include: matchInclude,
  });

  // Update listing and request statuses
  await prisma.listing.update({
    where: { id: match.listingId },
    data: { status: 'EXCHANGED' },
  });
  await prisma.request.update({
    where: { id: match.requestId },
    data: { status: 'FULFILLED' },
  });

  return updated;
}
