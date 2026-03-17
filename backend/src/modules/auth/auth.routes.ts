import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { rateLimit } from '../../middleware/rateLimiter';
import { sendOtpDto, verifyOtpDto, refreshTokenDto } from './auth.dto';
import * as authController from './auth.controller';

const router = Router();

// Rate limit OTP: 5 requests per 15 minutes
router.post(
  '/send-otp',
  rateLimit(15 * 60 * 1000, 5),
  validate(sendOtpDto),
  authController.handleSendOtp
);

// Rate limit OTP verification: 10 attempts per 15 minutes to prevent brute force
router.post(
  '/verify-otp',
  rateLimit(15 * 60 * 1000, 10),
  validate(verifyOtpDto),
  authController.handleVerifyOtp
);

router.post(
  '/refresh',
  validate(refreshTokenDto),
  authController.handleRefreshToken
);

export default router;
