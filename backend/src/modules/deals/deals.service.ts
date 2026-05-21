import prisma from '../../lib/prisma';
import { sendWhatsAppNotification } from '../../lib/whatsapp';
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

/**
 * Identity is only revealed after the deal is accepted. For any other status
 * (PENDING / REJECTED / CANCELLED / etc.) strip phone and email out of the
 * party records and the listing owner before sending the deal to a client.
 */
function redactContacts<T extends { status: string; buyer?: any; seller?: any; listing?: any }>(deal: T): T {
  if (deal.status === 'ACCEPTED' || deal.status === 'COMPLETED') {
    return deal;
  }
  const scrub = (u: any) => (u ? { id: u.id, name: u.name, city: u.city } : u);
  return {
    ...deal,
    buyer: scrub(deal.buyer),
    seller: scrub(deal.seller),
    listing: deal.listing
      ? { ...deal.listing, user: scrub(deal.listing.user) }
      : deal.listing,
  };
}

export async function createDeal(buyerId: string, data: CreateDealDto) {
  // Check if listing exists and is active
  const listing = await prisma.listing.findUnique({
    where: { id: data.listingId },
    include: { user: true },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.status !== 'ACTIVE') {
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

  const created = await prisma.deal.create({
    data: {
      listingId: data.listingId,
      sellerId: listing.userId,
      buyerId,
      agreedPrice: listing.sellingPrice,
      status: 'PENDING',
    },
    include: dealInclude,
  });
  const deal = redactContacts(created);

  // Notify the seller that someone is interested in their listing
  await prisma.notification.create({
    data: {
      userId: listing.userId,
      type: 'DEAL_REQUESTED',
      channel: 'PUSH',
      title: 'New Interest!',
      body: `Someone is interested in your listing "${listing.title}". Check your dashboard to respond.`,
      data: { dealId: deal.id, listingId: listing.id },
    },
  });

  // WhatsApp notification to seller (fire-and-forget)
  sendWhatsAppNotification({
    userId: listing.userId,
    phone: listing.user.phone,
    type: 'DEAL_REQUESTED',
    title: 'New Interest!',
    body: `Someone is interested in your listing "${listing.title}".`,
    data: { dealId: deal.id, listingId: listing.id },
    templateArgs: [listing.title],
  }).catch(() => {});

  return deal;
}

export async function getMyDealsAsBuyer(userId: string) {
  const deals = await prisma.deal.findMany({
    where: { buyerId: userId },
    include: dealInclude,
    orderBy: { createdAt: 'desc' },
  });
  return deals.map(redactContacts);
}

export async function getMyDealsAsSeller(userId: string) {
  const deals = await prisma.deal.findMany({
    where: { sellerId: userId },
    include: dealInclude,
    orderBy: { createdAt: 'desc' },
  });
  return deals.map(redactContacts);
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

  return redactContacts(deal);
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

  // Use a conditional transaction to prevent the race where two pending deals
  // for the same listing both get accepted: the listing must still be ACTIVE
  // AND this deal must still be PENDING, otherwise abort.
  if (data.status === 'ACCEPTED') {
    const updatedDeal = await prisma.$transaction(async (tx) => {
      const listingUpd = await tx.listing.updateMany({
        where: { id: deal.listingId, status: 'ACTIVE' },
        data: { status: 'SOLD' },
      });
      if (listingUpd.count === 0) {
        throw new Error('Listing is no longer available');
      }
      const dealUpd = await tx.deal.updateMany({
        where: { id: dealId, status: 'PENDING' },
        data: { status: 'ACCEPTED' },
      });
      if (dealUpd.count === 0) {
        throw new Error('Deal has already been responded to');
      }
      return tx.deal.findUniqueOrThrow({ where: { id: dealId }, include: dealInclude });
    });

    // Notify the buyer that their deal was accepted
    await prisma.notification.create({
      data: {
        userId: deal.buyerId,
        type: 'DEAL_ACCEPTED',
        channel: 'PUSH',
        title: 'Deal Accepted!',
        body: `Your request for "${deal.listing.title}" has been accepted. Check your dashboard for seller contact details.`,
        data: { dealId: deal.id, listingId: deal.listingId },
      },
    });

    // WhatsApp notification to buyer
    const buyer = await prisma.user.findUnique({ where: { id: deal.buyerId }, select: { phone: true } });
    if (buyer) {
      sendWhatsAppNotification({
        userId: deal.buyerId,
        phone: buyer.phone,
        type: 'DEAL_ACCEPTED',
        title: 'Deal Accepted!',
        body: `Your request for "${deal.listing.title}" has been accepted.`,
        data: { dealId: deal.id, listingId: deal.listingId },
        templateArgs: [deal.listing.title],
      }).catch(() => {});
    }

    return redactContacts(updatedDeal);
  }

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data: { status: data.status },
    include: dealInclude,
  });

  return redactContacts(updatedDeal);
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

  if (data.status === 'CANCELLED') {
    const [, updatedDeal] = await prisma.$transaction([
      prisma.listing.update({
        where: { id: deal.listingId },
        data: { status: 'ACTIVE' },
      }),
      prisma.deal.update({
        where: { id: dealId },
        data: { status: 'CANCELLED' },
        include: dealInclude,
      }),
    ]);

    // Notify the other party
    const otherUserId = userId === deal.buyerId ? deal.sellerId : deal.buyerId;
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'DEAL_CANCELLED',
        channel: 'PUSH',
        title: 'Deal Cancelled',
        body: `A deal has been cancelled. The listing is now available again.`,
        data: { dealId: deal.id, listingId: deal.listingId },
      },
    });

    // WhatsApp notification
    const otherUser = await prisma.user.findUnique({ where: { id: otherUserId }, select: { phone: true } });
    if (otherUser) {
      sendWhatsAppNotification({
        userId: otherUserId,
        phone: otherUser.phone,
        type: 'DEAL_CANCELLED',
        title: 'Deal Cancelled',
        body: 'A deal has been cancelled.',
        data: { dealId: deal.id, listingId: deal.listingId },
        templateArgs: [],
      }).catch(() => {});
    }

    return redactContacts(updatedDeal);
  }

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data: { status: 'COMPLETED' },
    include: dealInclude,
  });

  // Notify the other party about completion
  const completionOtherUserId = userId === deal.buyerId ? deal.sellerId : deal.buyerId;
  await prisma.notification.create({
    data: {
      userId: completionOtherUserId,
      type: 'DEAL_COMPLETED',
      channel: 'PUSH',
      title: 'Deal Completed!',
      body: `Your deal has been marked as completed. Thank you for using BookSwap!`,
      data: { dealId: deal.id, listingId: deal.listingId },
    },
  });

  // WhatsApp notification
  const completionOtherUser = await prisma.user.findUnique({ where: { id: completionOtherUserId }, select: { phone: true } });
  if (completionOtherUser) {
    sendWhatsAppNotification({
      userId: completionOtherUserId,
      phone: completionOtherUser.phone,
      type: 'DEAL_COMPLETED',
      title: 'Deal Completed!',
      body: 'Your deal has been marked as completed.',
      data: { dealId: deal.id, listingId: deal.listingId },
      templateArgs: [],
    }).catch(() => {});
  }

  return redactContacts(updatedDeal);
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

  // Only return the listing to ACTIVE if this deal was the one that took it
  // out of ACTIVE (i.e. this deal was ACCEPTED → listing was SOLD by us).
  // For PENDING deals the listing was never moved, so we must not flip it
  // — it might be SOLD by some other accepted deal in a concurrent flow.
  const updatedDeal = await prisma.$transaction(async (tx) => {
    if (deal.status === 'ACCEPTED') {
      await tx.listing.updateMany({
        where: { id: deal.listingId, status: 'SOLD' },
        data: { status: 'ACTIVE' },
      });
    }
    const cancelled = await tx.deal.updateMany({
      where: { id: dealId, status: deal.status },
      data: { status: 'CANCELLED' },
    });
    if (cancelled.count === 0) {
      throw new Error('Deal state changed; please retry');
    }
    return tx.deal.findUniqueOrThrow({ where: { id: dealId }, include: dealInclude });
  });

  // Notify the other party
  const otherUserId = userId === deal.buyerId ? deal.sellerId : deal.buyerId;
  await prisma.notification.create({
    data: {
      userId: otherUserId,
      type: 'DEAL_CANCELLED',
      channel: 'PUSH',
      title: 'Deal Cancelled',
      body: `A deal has been cancelled. The listing is now available again.`,
      data: { dealId: deal.id, listingId: deal.listingId },
    },
  });

  // WhatsApp notification
  const cancelOtherUser = await prisma.user.findUnique({ where: { id: otherUserId }, select: { phone: true } });
  if (cancelOtherUser) {
    sendWhatsAppNotification({
      userId: otherUserId,
      phone: cancelOtherUser.phone,
      type: 'DEAL_CANCELLED',
      title: 'Deal Cancelled',
      body: 'A deal has been cancelled.',
      data: { dealId: deal.id, listingId: deal.listingId },
      templateArgs: [],
    }).catch(() => {});
  }

  return redactContacts(updatedDeal);
}
