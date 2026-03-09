import jwt from 'jsonwebtoken'

export interface TokenPayload {
  userId: string
  id: string
  name: string
  role: string
  email: string
}

export const signAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
  } as jwt.SignOptions)

export const signRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
  } as jwt.SignOptions)

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload