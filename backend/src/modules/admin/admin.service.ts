import prisma from '../../lib/prisma';

export async function getStats() {
  const [users, listings, requests, matches, schools] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.request.count({ where: { status: { in: ['OPEN', 'MATCHED'] } } }),
    prisma.match.count(),
    prisma.school.count(),
  ]);

  const [completedMatches, totalListings, totalRequests] = await Promise.all([
    prisma.match.count({ where: { status: 'COMPLETED' } }),
    prisma.listing.count(),
    prisma.request.count(),
  ]);

  return {
    users,
    listings,
    requests,
    matches,
    schools,
    completedMatches,
    totalListings,
    totalRequests,
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
        _count: { select: { matches: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total, page, limit };
}
