import prisma from '../../lib/prisma';
import { sendOtpEmail } from '../../lib/email';
import { generateToken, generateRefreshToken, verifyToken } from '../../lib/jwt';

// DEV MODE: Only enabled when explicitly opted in via DEV_OTP_MODE=true
// In production, if SMTP is misconfigured, OTP sending will fail loudly instead of falling back to a hardcoded OTP
const DEV_MODE = process.env.DEV_OTP_MODE === 'true';
const DEV_OTP = '123456';

// LOCAL TEST LOGINS: emails listed in DEV_LOGIN_EMAILS (comma-separated) always get
// DEV_LOGIN_OTP and no email is sent. Hard-disabled unless NODE_ENV=development.
const DEV_LOGIN_ENABLED = process.env.NODE_ENV === 'development';
const DEV_LOGIN_OTP = process.env.DEV_LOGIN_OTP || '';
const DEV_LOGIN_EMAILS = (process.env.DEV_LOGIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isDevLogin(email: string) {
  return DEV_LOGIN_ENABLED && !!DEV_LOGIN_OTP && DEV_LOGIN_EMAILS.includes(email.trim().toLowerCase());
}

function generateOtp(): string {
  if (DEV_MODE) {
    console.log('🔐 DEV MODE: Using fixed OTP:', DEV_OTP);
    return DEV_OTP;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(email: string) {
  // Invalidate previous OTPs
  await prisma.otp.updateMany({
    where: { email, isUsed: false },
    data: { isUsed: true },
  });

  const devLogin = isDevLogin(email);
  const otp = devLogin ? DEV_LOGIN_OTP : generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otp.create({
    data: { email, otp, expiresAt },
  });

  if (devLogin) {
    console.log(`🔐 DEV LOGIN: fixed code for ${email} (email not sent)`);
    return { message: 'OTP sent successfully', devMode: true };
  }

  if (DEV_MODE) {
    console.log(`📧 DEV MODE: OTP for ${email} is ${otp} (email not sent)`);
    return { message: 'OTP sent successfully', devMode: true, hint: 'Use 123456' };
  }

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
