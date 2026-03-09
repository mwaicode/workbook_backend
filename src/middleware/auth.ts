import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, TokenPayload } from '../lib/jwt'
import { Role } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' })
    return
  }
  const token = authHeader.split(' ')[1]
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' })
  }
}

export const requireRole = (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ error: `Forbidden: requires role ${roles.join(' or ')}` })
      return
    }
    next()
  }