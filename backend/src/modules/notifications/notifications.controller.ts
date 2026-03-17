import { Request, Response } from 'express';
import { sendSuccess, sendPaginated, sendError } from '../../lib/response';
import * as notificationsService from './notifications.service';

export async function handleGetNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { notifications, total, unreadCount } = await notificationsService.getNotifications(userId, page, limit);
    return res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleMarkAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const notification = await notificationsService.markAsRead(userId, id);
    return sendSuccess(res, notification);
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400;
    return sendError(res, error.message, status);
  }
}

export async function handleMarkAllAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const result = await notificationsService.markAllAsRead(userId);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
