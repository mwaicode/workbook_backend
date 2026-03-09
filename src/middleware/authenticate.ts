import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../lib/jwt'
import { unauthorized } from '../utils/response';

/**
 * Extracts and verifies the Bearer JWT from Authorization header.
 * Populates req.user on success.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    unauthorized(res, 'Missing or malformed Authorization header');
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    // req.user = {
    //   id:    payload.sub,
    //   email: payload.email,
    //   name:  payload.name,
    //   role:  payload.role,
    // };

    req.user = {
  userId: payload.userId,
  id: payload.id,
  email: payload.email,
  name: payload.name,
  role: payload.role,
};
    next();
  } catch {
    unauthorized(res, 'Invalid or expired access token');
  }
}