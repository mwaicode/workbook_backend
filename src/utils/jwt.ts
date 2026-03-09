import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { JwtAccessPayload, JwtRefreshPayload } from '../types';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES  || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

// ── Sign ───────────────────────────────────────────────────────────

export function signAccessToken(payload: {
  id: string;
  email: string;
  name: string;
  role: Role;
}): string {
  return jwt.sign(
    { sub: payload.id, email: payload.email, name: payload.name, role: payload.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions
  );
}

export function signRefreshToken(userId: string, tokenId: string): string {
  return jwt.sign(
    { sub: userId, tokenId },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions
  );
}

// ── Verify ─────────────────────────────────────────────────────────

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtRefreshPayload;
}

// ── Decode expiry helper ───────────────────────────────────────────

export function refreshExpiresAt(): Date {
  const ms = parseExpiry(REFRESH_EXPIRES);
  return new Date(Date.now() + ms);
}

function parseExpiry(expiry: string): number {
  const units: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86400000; // default 7d
  return parseInt(match[1]) * units[match[2]];
}