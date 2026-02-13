import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../lib/response';
import * as authService from './auth.service';

export async function handleSendOtp(req: Request, res: Response) {
  try {
    const result = await authService.sendOtp(req.body.email);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to send OTP', 500);
  }
}

export async function handleVerifyOtp(req: Request, res: Response) {
  try {
    const result = await authService.verifyOtp(req.body.email, req.body.otp);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message || 'Verification failed');
  }
}

export async function handleRefreshToken(req: Request, res: Response) {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, 'Invalid refresh token', 401);
  }
}
