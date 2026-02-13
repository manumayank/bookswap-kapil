import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../lib/response';
import * as usersService from './users.service';

export async function handleRegister(req: Request, res: Response) {
  try {
    const result = await usersService.registerUser(req.body);
    return sendSuccess(res, result, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleGetMe(req: Request, res: Response) {
  try {
    const user = await usersService.getUser(req.user!.userId);
    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message, 404);
  }
}

export async function handleUpdateMe(req: Request, res: Response) {
  try {
    const user = await usersService.updateUser(req.user!.userId, req.body);
    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleAddChild(req: Request, res: Response) {
  try {
    const child = await usersService.addChild(req.user!.userId, req.body);
    return sendSuccess(res, child, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleUpdateChild(req: Request, res: Response) {
  try {
    const child = await usersService.updateChild(
      req.user!.userId,
      req.params.id,
      req.body
    );
    return sendSuccess(res, child);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleDeleteChild(req: Request, res: Response) {
  try {
    const result = await usersService.deleteChild(req.user!.userId, req.params.id);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}
