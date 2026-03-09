import prisma from '../../lib/prisma';
import { checkRequestMatches } from '../requests/requests.service';

export async function getStats() {
  const [users, activeListings, openRequests, deals, schools] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.request.count({ where: { status: { in: ['OPEN', 'MATCHED'] } } }),
    prisma.deal.count(),
    prisma.school.count(),
  ]);

  const [completedDeals, totalListings, totalRequests, pendingListings] = await Promise.all([
    prisma.deal.count({ where: { status: 'COMPLETED' } }),
    prisma.listing.count(),
    prisma.request.count(),
    prisma.listing.count({ where: { status: 'PENDING_APPROVAL' } }),
  ]);

  return {
    users,
    activeListings,
    openRequests,
    deals,
    schools,
    completedDeals,
    totalListings,
    totalRequests,
    pendingListings,
  };
}

export async function getUsers(page = 1, limit = 50, search?: string) {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        children: true,
        school: true,
        _count: { select: { listings: true, requests: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}

export async function getListings(page = 1, limit = 50, status?: string) {
  const skip = (page - 1) * limit;

  const where = status ? { status: status as any } : {};

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, city: true } },
        items: true,
        school: true,
        _count: { select: { deals: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total, page, limit };
}

export async function getPendingListings(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const where = { status: 'PENDING_APPROVAL' as const };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, city: true } },
        items: true,
        images: true,
        school: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total, page, limit };
}

export async function approveListing(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true, title: true, status: true, board: true, class: true, city: true, schoolId: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'PENDING_APPROVAL') {
    throw new Error(`Listing cannot be approved — current status is ${listing.status}`);
  }

  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: { status: 'ACTIVE' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
      school: true,
    },
  });

  // Notify the seller that their listing has been approved
  await prisma.notification.create({
    data: {
      userId: listing.userId,
      type: 'LISTING_APPROVED',
      channel: 'PUSH',
      title: 'Listing Approved',
      body: `Your listing "${listing.title}" has been approved and is now visible to buyers.`,
      data: { listingId: listing.id },
    },
  });

  // Find matching requests and notify those requesters
  const matchedRequests = listing.board && listing.class
    ? await checkRequestMatches({
        board: listing.board,
        class: listing.class,
        city: listing.city,
        price: updatedListing.sellingPrice,
      })
    : [];

  for (const request of matchedRequests) {
    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'NEW_MATCH_FOR_REQUEST',
        channel: 'PUSH',
        title: 'New Book Available',
        body: `A book matching your request is now available: "${listing.title}"`,
        data: { listingId: listing.id, requestId: request.id },
      },
    });
  }

  return updatedListing;
}

export async function rejectListing(listingId: string, reason?: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true, title: true, status: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'PENDING_APPROVAL') {
    throw new Error(`Listing cannot be rejected — current status is ${listing.status}`);
  }

  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: { status: 'REJECTED' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
      school: true,
    },
  });

  // Notify the seller that their listing has been rejected
  await prisma.notification.create({
    data: {
      userId: listing.userId,
      type: 'LISTING_REJECTED',
      channel: 'PUSH',
      title: 'Listing Rejected',
      body: reason
        ? `Your listing "${listing.title}" was rejected: ${reason}`
        : `Your listing "${listing.title}" was rejected. Please review and resubmit.`,
      data: { listingId: listing.id, reason: reason || null },
    },
  });

  return updatedListing;
}
