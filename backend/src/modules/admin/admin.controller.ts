import { Request, Response } from 'express';
import { sendSuccess, sendPaginated, sendError } from '../../lib/response';
import * as adminService from './admin.service';

export async function handleGetStats(req: Request, res: Response) {
  try {
    const stats = await adminService.getStats();
    return sendSuccess(res, stats);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleGetUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string | undefined;

    const { users, total } = await adminService.getUsers(page, limit, search);
    return sendPaginated(res, users, total, page, limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleGetListings(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;

    const { listings, total } = await adminService.getListings(page, limit, status);
    return sendPaginated(res, listings, total, page, limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
