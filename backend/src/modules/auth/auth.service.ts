import prisma from '../../lib/prisma';
import { sendOtpEmail } from '../../lib/email';
import { generateToken, generateRefreshToken, verifyToken } from '../../lib/jwt';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(email: string) {
  // Invalidate previous OTPs
  await prisma.otp.updateMany({
    where: { email, isUsed: false },
    data: { isUsed: true },
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otp.create({
    data: { email, otp, expiresAt },
  });

  await sendOtpEmail(email, otp);

  return { message: 'OTP sent to your email' };
}

export async function verifyOtp(email: string, otp: string) {
  const record = await prisma.otp.findFirst({
    where: {
      email,
      otp,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new Error('Invalid or expired OTP');
  }

  // Mark OTP as used
  await prisma.otp.update({
    where: { id: record.id },
    data: { isUsed: true },
  });

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Existing user — return tokens
    const payload = { userId: user.id, email: user.email };
    return {
      isNewUser: false,
      accessToken: generateToken(payload),
      refreshToken: generateRefreshToken(payload),
      user,
    };
  }

  // New user — return flag for registration
  return {
    isNewUser: true,
    verifiedEmail: email,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyToken(refreshToken);
  const newPayload = { userId: payload.userId, email: payload.email };
  return {
    accessToken: generateToken(newPayload),
    refreshToken: generateRefreshToken(newPayload),
  };
}
