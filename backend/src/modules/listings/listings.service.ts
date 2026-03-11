import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { CreateListingDto, UpdateListingDto, SearchListingsDto } from './listings.dto';
import { findOrCreateSchool } from '../schools/schools.service';

/** Include for owner views (full details) */
const listingIncludeOwner = {
  images: true,
  items: true,
  user: { select: { id: true, name: true, city: true, phone: true, address: true } },
  school: true,
};

/** Include for public views (limited seller info) */
const listingIncludePublic = {
  images: true,
  items: true,
  user: { select: { id: true, name: true, city: true } },
  school: { select: { id: true, name: true, city: true, board: true } },
};

/**
 * Create a new listing. Status defaults to PENDING_APPROVAL.
 * Auto-creates school if schoolName is provided but schoolId is not.
 * After creation, triggers request matching in the background.
 */
export async function createListing(userId: string, data: CreateListingDto) {
  let schoolId = data.schoolId;

  // Auto-create school if schoolName is provided but schoolId is not
  if (!schoolId && data.schoolName && data.board) {
    const school = await findOrCreateSchool(
      data.schoolName,
      data.city,
      data.board
    );
    if (school) {
      schoolId = school.id;
    }
  }

  const listingData = {
    title: data.title,
    description: data.description,
    category: data.category,
    board: data.board,
    class: data.class,
    subject: data.subject,
    schoolId: schoolId,
    city: data.city,
    sector: data.sector,
    pickupLocation: data.pickupLocation,
    buyingPrice: data.buyingPrice,
    sellingPrice: data.sellingPrice,
    condition: data.condition,
    yearOfPurchase: data.yearOfPurchase,
    userId,
    status: 'PENDING_APPROVAL' as const,
  };

  const listing = await prisma.listing.create({
    data: listingData,
    include: listingIncludeOwner,
  });

  // Trigger request matching in background (non-blocking)
  checkRequestMatches(listing.id).catch(console.error);

  return listing;
}

/**
 * Search active listings with filters, text search, sorting, and pagination.
 * Only returns ACTIVE listings.
 */
export async function searchListings(query: SearchListingsDto) {
  const {
    search,
    category,
    board,
    class: classNum,
    city,
    minPrice,
    maxPrice,
    sortBy,
    page,
    limit,
  } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ListingWhereInput = { status: 'ACTIVE' };

  // Text search on title
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  if (category) where.category = category;
  if (board) where.board = board;
  if (classNum) where.class = classNum;
  if (city) where.city = { contains: city, mode: 'insensitive' };

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.sellingPrice = {};
    if (minPrice !== undefined) where.sellingPrice.gte = minPrice;
    if (maxPrice !== undefined) where.sellingPrice.lte = maxPrice;
  }

  // Sorting
  let orderBy: Prisma.ListingOrderByWithRelationInput;
  switch (sortBy) {
    case 'price_asc':
      orderBy = { sellingPrice: 'asc' };
      break;
    case 'price_desc':
      orderBy = { sellingPrice: 'desc' };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' };
      break;
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: listingIncludePublic,
      orderBy,
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total, page, limit };
}

/**
 * Get a single listing by ID.
 * For non-owners, only returns seller first name + city (no phone/address).
 */
export async function getListing(id: string, requestingUserId?: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: listingIncludeOwner,
  });

  if (!listing) throw new Error('Listing not found');

  // If requester is the owner, return full details
  if (requestingUserId && listing.userId === requestingUserId) {
    return listing;
  }

  // For non-owners, strip sensitive seller info
  const { user, ...rest } = listing;
  return {
    ...rest,
    user: {
      id: user.id,
      name: user.name.split(' ')[0], // First name only
      city: user.city,
    },
  };
}

/**
 * Get all listings belonging to the current user.
 */
export async function getMyListings(userId: string) {
  return prisma.listing.findMany({
    where: { userId },
    include: listingIncludeOwner,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update a listing. Only allowed if status is PENDING_APPROVAL or ACTIVE.
 */
export async function updateListing(userId: string, id: string, data: UpdateListingDto) {
  const listing = await prisma.listing.findFirst({
    where: { id, userId },
  });

  if (!listing) throw new Error('Listing not found');

  if (listing.status !== 'PENDING_APPROVAL' && listing.status !== 'ACTIVE') {
    throw new Error('Listing cannot be updated in its current status');
  }

  return prisma.listing.update({
    where: { id },
    data,
    include: listingIncludeOwner,
  });
}

/**
 * Cancel a listing by setting status to CANCELLED.
 */
export async function cancelListing(userId: string, id: string) {
  const listing = await prisma.listing.findFirst({
    where: { id, userId },
  });

  if (!listing) throw new Error('Listing not found');

  return prisma.listing.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: listingIncludeOwner,
  });
}

/**
 * Add images to a listing.
 */
export async function addImages(listingId: string, userId: string, files: Express.Multer.File[]) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, userId },
  });
  if (!listing) throw new Error('Listing not found');

  const images = files.map((file) => ({
    listingId,
    imageUrl: `/uploads/${file.filename}`,
  }));

  await prisma.listingImage.createMany({ data: images });

  return prisma.listingImage.findMany({ where: { listingId } });
}

/**
 * Check for matching requests when a new listing is created.
 * Finds open requests that match by board/class/city and notifies buyers.
 */
async function checkRequestMatches(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });
  if (!listing || listing.status !== 'PENDING_APPROVAL') return;

  // Find open requests that could match this listing
  const where: Prisma.RequestWhereInput = {
    status: 'OPEN',
    userId: { not: listing.userId },
  };

  if (listing.class) where.class = listing.class;
  if (listing.board) where.board = listing.board;
  if (listing.city) {
    where.city = { equals: listing.city, mode: 'insensitive' };
  }

  // Price filter: only match requests where maxPrice >= listing sellingPrice
  if (listing.sellingPrice) {
    where.maxPrice = { gte: listing.sellingPrice };
  }

  const matchingRequests = await prisma.request.findMany({ where });

  // TODO: Send notifications to request owners about the new matching listing
  // For now, just log the count
  if (matchingRequests.length > 0) {
    console.log(
      `Found ${matchingRequests.length} matching request(s) for listing ${listingId}`
    );
  }

  return matchingRequests;
}
