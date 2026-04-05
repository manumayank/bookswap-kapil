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

  // Use transaction to prevent race condition where two deals get accepted simultaneously
  if (data.status === 'ACCEPTED') {
    const [, updatedDeal] = await prisma.$transaction([
      prisma.listing.update({
        where: { id: deal.listingId },
        data: { status: 'SOLD' },
      }),
      prisma.deal.update({
        where: { id: dealId },
        data: { status: 'ACCEPTED' },
        include: dealInclude,
      }),
    ]);

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

    return updatedDeal;
  }

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data: { status: data.status },
    include: dealInclude,
  });

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

    return updatedDeal;
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

  return updatedDeal;
}
