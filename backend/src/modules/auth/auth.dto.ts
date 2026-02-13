import { z } from 'zod';

export const sendOtpDto = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyOtpDto = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const refreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type SendOtpDto = z.infer<typeof sendOtpDto>;
export type VerifyOtpDto = z.infer<typeof verifyOtpDto>;
export type RefreshTokenDto = z.infer<typeof refreshTokenDto>;
