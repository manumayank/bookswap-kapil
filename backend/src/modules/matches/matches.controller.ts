import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../lib/response';
import * as matchesService from './matches.service';

export async function handleCreateDeal(req: Request, res: Response) {
  try {
    const deal = await matchesService.createDeal(
      req.user!.userId,
      req.body.listingId,
      req.body.offeredPrice
    );
    return sendSuccess(res, deal, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleGetDeals(req: Request, res: Response) {
  try {
    const deals = await matchesService.getMyDeals(req.user!.userId);
    return sendSuccess(res, deals);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleAccept(req: Request, res: Response) {
  try {
    const deal = await matchesService.acceptDeal(req.user!.userId, req.params.id);
    return sendSuccess(res, deal);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleReject(req: Request, res: Response) {
  try {
    const deal = await matchesService.rejectDeal(req.user!.userId, req.params.id);
    return sendSuccess(res, deal);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleComplete(req: Request, res: Response) {
  try {
    const deal = await matchesService.completeDeal(req.user!.userId, req.params.id);
    return sendSuccess(res, deal);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleCancel(req: Request, res: Response) {
  try {
    const deal = await matchesService.cancelDeal(req.user!.userId, req.params.id);
    return sendSuccess(res, deal);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}
