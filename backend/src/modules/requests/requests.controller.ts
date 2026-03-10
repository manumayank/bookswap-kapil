import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../lib/response';
import * as requestsService from './requests.service';

export async function handleCreate(req: Request, res: Response) {
  try {
    const result = await requestsService.createRequest(req.user!.userId, req.body);
    return sendSuccess(res, result, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleFindMatches(req: Request, res: Response) {
  try {
    const listings = await requestsService.findMatchesForCriteria(req.body);
    return sendSuccess(res, { 
      listings, 
      count: listings.length,
      hasMatches: listings.length > 0 
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleGetMyRequests(req: Request, res: Response) {
  try {
    const requests = await requestsService.getMyRequests(req.user!.userId);
    return sendSuccess(res, requests);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleGetMatches(req: Request, res: Response) {
  try {
    const result = await requestsService.getMatchesForRequest(req.user!.userId, req.params.id);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleUpdate(req: Request, res: Response) {
  try {
    const result = await requestsService.updateRequest(
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
    const result = await requestsService.cancelRequest(req.user!.userId, req.params.id);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}
