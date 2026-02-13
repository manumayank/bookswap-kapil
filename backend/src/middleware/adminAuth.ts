import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { sendError } from '../lib/response';
import prisma from '../lib/prisma';

/** Middleware that requires the user to be authenticated AND an admin */
export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;

    // Check admin status from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return sendError(res, 'Admin access required', 403);
    }

    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
}
