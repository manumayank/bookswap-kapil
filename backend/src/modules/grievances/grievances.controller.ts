import { Request, Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from '../../lib/response';
import * as grievancesService from './grievances.service';

export async function handleCreate(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const grievance = await grievancesService.createGrievance(userId, req.body);
    return sendSuccess(res, grievance, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleGetMine(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const grievances = await grievancesService.getMyGrievances(userId);
    return sendSuccess(res, grievances);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleAdminList(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;
    const result = await grievancesService.listForAdmin(page, limit, status);
    return sendPaginated(res, result.grievances, result.total, result.page, result.limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleAdminUpdateStatus(req: Request, res: Response) {
  try {
    const grievance = await grievancesService.updateStatus(req.params.id, req.body);
    return sendSuccess(res, grievance);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
