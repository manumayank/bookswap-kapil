import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../lib/response';
import * as dealsService from './deals.service';

export async function handleCreate(req: Request, res: Response) {
  try {
    const result = await dealsService.createDeal(req.user!.userId, req.body);
    return sendSuccess(res, result, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleGetMyDealsAsBuyer(req: Request, res: Response) {
  try {
    const deals = await dealsService.getMyDealsAsBuyer(req.user!.userId);
    return sendSuccess(res, deals);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleGetMyDealsAsSeller(req: Request, res: Response) {
  try {
    const deals = await dealsService.getMyDealsAsSeller(req.user!.userId);
    return sendSuccess(res, deals);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleGetById(req: Request, res: Response) {
  try {
    const deal = await dealsService.getDealById(req.user!.userId, req.params.id);
    return sendSuccess(res, deal);
  } catch (error: any) {
    return sendError(res, error.message, 404);
  }
}

export async function handleRespond(req: Request, res: Response) {
  try {
    const result = await dealsService.respondToDeal(
      req.user!.userId,
      req.params.id,
      req.body
    );
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleComplete(req: Request, res: Response) {
  try {
    const result = await dealsService.completeDeal(
      req.user!.userId,
      req.params.id,
      req.body
    );
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleCancel(req: Request, res: Response) {
  try {
    const result = await dealsService.cancelDeal(req.user!.userId, req.params.id);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}
