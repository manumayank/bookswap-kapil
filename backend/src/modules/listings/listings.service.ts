import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { CreateListingDto, UpdateListingDto, SearchListingsDto } from './listings.dto';

const listingInclude = {
  items: true,
  images: true,
  user: { select: { id: true, name: true, city: true } },
  school: true,
};

export async function createListing(userId: string, data: CreateListingDto) {
  const { items, ...listingData } = data;

  return prisma.listing.create({
    data: {
      ...listingData,
      userId,
      items: {
        create: items,
      },
    },
    include: listingInclude,
  });
}

export async function searchListings(query: SearchListingsDto) {
  const { board, class: classNum, city, schoolId, condition, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ListingWhereInput = { status: 'ACTIVE' };
  if (board) where.board = board;
  if (classNum) where.class = classNum;
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (schoolId) where.schoolId = schoolId;
  if (condition) {
    // Only show books meeting minimum condition
    const conditionOrder = ['UNUSED', 'ALMOST_NEW', 'WATER_MARKS', 'UNDERLINED'];
    const minIndex = conditionOrder.indexOf(condition);
    where.condition = { in: conditionOrder.slice(0, minIndex + 1) as any };
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: listingInclude,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total, page, limit };
}

export async function getListing(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: listingInclude,
  });
  if (!listing) throw new Error('Listing not found');
  return listing;
}

export async function getMyListings(userId: string) {
  return prisma.listing.findMany({
    where: { userId },
    include: listingInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateListing(userId: string, id: string, data: UpdateListingDto) {
  const listing = await prisma.listing.findFirst({
    where: { id, userId },
  });
  if (!listing) throw new Error('Listing not found');

  return prisma.listing.update({
    where: { id },
    data,
    include: listingInclude,
  });
}

export async function cancelListing(userId: string, id: string) {
  const listing = await prisma.listing.findFirst({
    where: { id, userId },
  });
  if (!listing) throw new Error('Listing not found');

  return prisma.listing.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: listingInclude,
  });
}

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
