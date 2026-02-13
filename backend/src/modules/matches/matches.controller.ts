import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../lib/response';
import * as matchesService from './matches.service';

export async function handleGetMatches(req: Request, res: Response) {
  try {
    const matches = await matchesService.getMyMatches(req.user!.userId);
    return sendSuccess(res, matches);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleAccept(req: Request, res: Response) {
  try {
    const match = await matchesService.acceptMatch(req.user!.userId, req.params.id);
    return sendSuccess(res, match);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleReject(req: Request, res: Response) {
  try {
    const match = await matchesService.rejectMatch(req.user!.userId, req.params.id);
    return sendSuccess(res, match);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleSchedule(req: Request, res: Response) {
  try {
    const match = await matchesService.scheduleExchange(
      req.user!.userId,
      req.params.id,
      req.body
    );
    return sendSuccess(res, match);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleComplete(req: Request, res: Response) {
  try {
    const match = await matchesService.completeMatch(req.user!.userId, req.params.id);
    return sendSuccess(res, match);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}
