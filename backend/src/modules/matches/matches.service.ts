import prisma from '../../lib/prisma';

/** Select fields for user, conditionally including phone */
const userPublicSelect = { id: true, name: true, city: true };
const userWithPhoneSelect = { ...userPublicSelect, phone: true };

const dealInclude = {
  listing: {
    include: {
      items: true,
      images: true,
      school: true,
    },
  },
  seller: { select: userPublicSelect },
  buyer: { select: userPublicSelect },
};

const dealIncludeWithPhone = {
  listing: {
    include: {
      items: true,
      images: true,
      school: true,
    },
  },
  seller: { select: userWithPhoneSelect },
  buyer: { select: userWithPhoneSelect },
};

/**
 * Create a new deal (buyer initiates).
 * Validates listing is ACTIVE and buyer is not the seller.
 */
export async function createDeal(buyerId: string, listingId: string, offeredPrice?: number) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error('Listing not found');
  if (listing.status !== 'ACTIVE') throw new Error('Listing is not active');
  if (listing.userId === buyerId) throw new Error('You cannot buy your own listing');

  const agreedPrice = offeredPrice ?? listing.sellingPrice;

  const deal = await prisma.deal.create({
    data: {
      listingId,
      sellerId: listing.userId,
      buyerId,
      agreedPrice,
    },
    include: dealInclude,
  });

  return deal;
}

/**
 * Seller accepts a pending deal.
 * Returns deal with phone numbers so both parties can contact each other.
 */
export async function acceptDeal(sellerId: string, dealId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error('Deal not found');
  if (deal.sellerId !== sellerId) throw new Error('Only the seller can accept this deal');
  if (deal.status !== 'PENDING') throw new Error('Deal is not in pending status');

  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: { status: 'ACCEPTED' },
    include: dealIncludeWithPhone,
  });

  return updated;
}

/** Seller rejects a pending deal. */
export async function rejectDeal(sellerId: string, dealId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error('Deal not found');
  if (deal.sellerId !== sellerId) throw new Error('Only the seller can reject this deal');
  if (deal.status !== 'PENDING') throw new Error('Deal is not in pending status');

  return prisma.deal.update({
    where: { id: dealId },
    data: { status: 'REJECTED' },
    include: dealInclude,
  });
}

/**
 * Either party marks an accepted deal as complete.
 * Also sets the listing status to SOLD.
 */
export async function completeDeal(userId: string, dealId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error('Deal not found');
  if (deal.sellerId !== userId && deal.buyerId !== userId) {
    throw new Error('You are not part of this deal');
  }
  if (deal.status !== 'ACCEPTED') throw new Error('Deal must be accepted before completing');

  // Update both in transaction so the response includes fresh listing status
  const [, updated] = await prisma.$transaction([
    prisma.listing.update({
      where: { id: deal.listingId },
      data: { status: 'SOLD' },
    }),
    prisma.deal.update({
      where: { id: dealId },
      data: { status: 'COMPLETED' },
      include: dealIncludeWithPhone,
    }),
  ]);

  return updated;
}

/** Either party can cancel a pending deal. */
export async function cancelDeal(userId: string, dealId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error('Deal not found');
  if (deal.sellerId !== userId && deal.buyerId !== userId) {
    throw new Error('You are not part of this deal');
  }
  if (deal.status !== 'PENDING') throw new Error('Only pending deals can be cancelled');

  return prisma.deal.update({
    where: { id: dealId },
    data: { status: 'CANCELLED' },
    include: dealInclude,
  });
}

/**
 * Get all deals where user is buyer or seller.
 * Phone numbers are only included for ACCEPTED or COMPLETED deals.
 */
export async function getMyDeals(userId: string) {
  const deals = await prisma.deal.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: {
      listing: {
        include: {
          items: true,
          images: true,
          school: true,
        },
      },
      seller: { select: userWithPhoneSelect },
      buyer: { select: userWithPhoneSelect },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Strip phone numbers from deals that are not ACCEPTED or COMPLETED
  return deals.map((deal) => {
    if (deal.status === 'ACCEPTED' || deal.status === 'COMPLETED') {
      return deal;
    }
    return {
      ...deal,
      seller: { id: deal.seller.id, name: deal.seller.name, city: deal.seller.city },
      buyer: { id: deal.buyer.id, name: deal.buyer.name, city: deal.buyer.city },
    };
  });
}
