import { Request, Response } from 'express';
import { sendSuccess, sendPaginated, sendError } from '../../lib/response';
import * as schoolsService from './schools.service';

export async function handleSearch(req: Request, res: Response) {
  try {
    const { schools, total, page, limit } = await schoolsService.searchSchools(
      req.query as any
    );
    return sendPaginated(res, schools, total, page, limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleGetSchool(req: Request, res: Response) {
  try {
    const school = await schoolsService.getSchool(req.params.id);
    return sendSuccess(res, school);
  } catch (error: any) {
    return sendError(res, error.message, 404);
  }
}

export async function handleSuggest(req: Request, res: Response) {
  try {
    const school = await schoolsService.suggestSchool(req.body);
    return sendSuccess(res, school, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}
