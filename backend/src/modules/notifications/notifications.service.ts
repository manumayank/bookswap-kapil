import prisma from '../../lib/prisma';

export async function getNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  // Only surface in-app PUSH notifications. WHATSAPP rows are delivery
  // logs created by sendWhatsAppNotification and must not appear in the feed.
  const where = { userId, channel: 'PUSH' as const };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sentAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
  ]);

  return { notifications, total, unreadCount, page, limit };
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) throw new Error('Notification not found');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { message: 'All notifications marked as read' };
}
