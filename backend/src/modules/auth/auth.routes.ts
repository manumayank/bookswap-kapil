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

router.post(
  '/verify-otp',
  validate(verifyOtpDto),
  authController.handleVerifyOtp
);

router.post(
  '/refresh',
  validate(refreshTokenDto),
  authController.handleRefreshToken
);

export default router;
