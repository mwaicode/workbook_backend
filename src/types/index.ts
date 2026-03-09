import { Role } from '@prisma/client';

// Augment Express Request to carry the authed user

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface JwtAccessPayload {
  sub: string;   // user id
  email: string;
  name: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;   // user id
  tokenId: string;
  iat?: number;
  exp?: number;
}

export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };