import { Request, Response } from 'express';
import { sendSuccess, sendPaginated, sendError } from '../../lib/response';
import * as listingsService from './listings.service';

export async function handleCreate(req: Request, res: Response) {
  try {
    const listing = await listingsService.createListing(req.user!.userId, req.body);
    return sendSuccess(res, listing, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleSearch(req: Request, res: Response) {
  try {
    const { listings, total, page, limit } = await listingsService.searchListings(
      req.query as any
    );
    return sendPaginated(res, listings, total, page, limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleGetListing(req: Request, res: Response) {
  try {
    const requestingUserId = req.user?.userId;
    const listing = await listingsService.getListing(req.params.id, requestingUserId);
    return sendSuccess(res, listing);
  } catch (error: any) {
    return sendError(res, error.message, 404);
  }
}

export async function handleGetMyListings(req: Request, res: Response) {
  try {
    const listings = await listingsService.getMyListings(req.user!.userId);
    return sendSuccess(res, listings);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleUpdate(req: Request, res: Response) {
  try {
    const listing = await listingsService.updateListing(
      req.user!.userId,
      req.params.id,
      req.body
    );
    return sendSuccess(res, listing);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleCancel(req: Request, res: Response) {
  try {
    const listing = await listingsService.cancelListing(req.user!.userId, req.params.id);
    return sendSuccess(res, listing);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleUploadImages(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      return sendError(res, 'No files uploaded');
    }
    const images = await listingsService.addImages(
      req.params.id,
      req.user!.userId,
      files
    );
    return sendSuccess(res, images, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}
