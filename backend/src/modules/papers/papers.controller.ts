import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../lib/response';
import * as papersService from './papers.service';

export async function handleCreate(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const fileUrl = `/uploads/${file.filename}`;
    const result = await papersService.createPaper(
      req.user!.userId,
      req.body,
      fileUrl
    );
    return sendSuccess(res, result, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleSearch(req: Request, res: Response) {
  try {
    const result = await papersService.searchPapers(req.query as any);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleGetById(req: Request, res: Response) {
  try {
    const paper = await papersService.getPaperById(req.params.id);
    return sendSuccess(res, paper);
  } catch (error: any) {
    return sendError(res, error.message, 404);
  }
}

export async function handleDownload(req: Request, res: Response) {
  try {
    const result = await papersService.incrementDownloadCount(req.params.id);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}
