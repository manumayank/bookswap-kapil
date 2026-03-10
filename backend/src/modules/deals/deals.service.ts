import prisma from '../../lib/prisma';
import { CreateDealDto, RespondToDealDto, CompleteDealDto } from './deals.dto';

const dealInclude = {
  listing: {
    include: {
      images: true,
      user: { select: { id: true, name: true, phone: true, email: true } },
    },
  },
  buyer: { select: { id: true, name: true, phone: true, email: true, city: true } },
  seller: { select: { id: true, name: true, phone: true, email: true, city: true } },
};

export async function createDeal(buyerId: string, data: CreateDealDto) {
  // Check if listing exists and is active
  const listing = await prisma.listing.findUnique({
    where: { id: data.listingId },
    include: { user: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'ACTIVE' && listing.status !== 'PENDING_APPROVAL') {
    throw new Error('This listing is no longer available');
  }

  if (listing.userId === buyerId) {
    throw new Error('You cannot buy your own listing');
  }

  // Check if there's already a pending deal for this listing by this buyer
  const existingDeal = await prisma.deal.findFirst({
    where: {
      listingId: data.listingId,
      buyerId,
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
  });

  if (existingDeal) {
    throw new Error('You already have an active deal for this listing');
  }

  const deal = await prisma.deal.create({
    data: {
      listingId: data.listingId,
      sellerId: listing.userId,
      buyerId,
      agreedPrice: listing.sellingPrice,
      status: 'PENDING',
    },
    include: dealInclude,
  });

  return deal;
}

export async function getMyDealsAsBuyer(userId: string) {
  return prisma.deal.findMany({
    where: { buyerId: userId },
    include: dealInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMyDealsAsSeller(userId: string) {
  return prisma.deal.findMany({
    where: { sellerId: userId },
    include: dealInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDealById(userId: string, dealId: string) {
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: dealInclude,
  });

  if (!deal) {
    throw new Error('Deal not found');
  }

  return deal;
}

export async function respondToDeal(
  sellerId: string,
  dealId: string,
  data: RespondToDealDto
) {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, sellerId },
    include: { listing: true },
  });

  if (!deal) {
    throw new Error('Deal not found');
  }

  if (deal.status !== 'PENDING') {
    throw new Error('Deal has already been responded to');
  }

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data: { status: data.status },
    include: dealInclude,
  });

  // If accepted, mark listing as reserved/sold to prevent other deals
  if (data.status === 'ACCEPTED') {
    await prisma.listing.update({
      where: { id: deal.listingId },
      data: { status: 'SOLD' },
    });
  }

  return updatedDeal;
}

export async function completeDeal(
  userId: string,
  dealId: string,
  data: CompleteDealDto
) {
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
  });

  if (!deal) {
    throw new Error('Deal not found');
  }

  if (deal.status !== 'ACCEPTED') {
    throw new Error('Deal must be accepted before completing');
  }

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data: { status: data.status },
    include: dealInclude,
  });

  // If cancelled, make listing active again
  if (data.status === 'CANCELLED') {
    await prisma.listing.update({
      where: { id: deal.listingId },
      data: { status: 'ACTIVE' },
    });
  }

  return updatedDeal;
}

export async function cancelDeal(userId: string, dealId: string) {
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
  });

  if (!deal) {
    throw new Error('Deal not found');
  }

  if (deal.status === 'COMPLETED' || deal.status === 'CANCELLED') {
    throw new Error('Deal is already finalized');
  }

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data: { status: 'CANCELLED' },
    include: dealInclude,
  });

  // Make listing active again
  await prisma.listing.update({
    where: { id: deal.listingId },
    data: { status: 'ACTIVE' },
  });

  return updatedDeal;
}
