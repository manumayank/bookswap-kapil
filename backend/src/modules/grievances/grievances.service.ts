import prisma from '../../lib/prisma';
import { sendEventEmail, getAdminEmails } from '../../lib/email';
import { CreateGrievanceDto, UpdateGrievanceStatusDto } from './grievances.dto';

export async function createGrievance(userId: string, data: CreateGrievanceDto) {
  const grievance = await prisma.grievance.create({
    data: {
      userId,
      subject: data.subject,
      description: data.description,
      transactionCode: data.transactionCode || null,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  sendEventEmail({
    to: getAdminEmails(),
    type: 'GRIEVANCE_FILED',
    vars: {
      submitterName: grievance.user.name,
      submitterEmail: grievance.user.email,
      transactionCode: grievance.transactionCode,
      subject: grievance.subject,
      description: grievance.description,
    },
  }).catch(console.error);

  return grievance;
}

export async function getMyGrievances(userId: string) {
  return prisma.grievance.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listForAdmin(page = 1, limit = 50, status?: string) {
  const skip = (page - 1) * limit;
  const where = status ? { status: status as any } : {};
  const [grievances, total] = await Promise.all([
    prisma.grievance.findMany({
      where,
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.grievance.count({ where }),
  ]);
  return { grievances, total, page, limit };
}

export async function updateStatus(id: string, data: UpdateGrievanceStatusDto) {
  return prisma.grievance.update({
    where: { id },
    data: { status: data.status },
  });
}
