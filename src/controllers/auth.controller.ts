
import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt'
import { Role } from '@prisma/client'

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body
    if (!email || !password || !name || !role) {
      res.status(400).json({ error: 'All fields are required' }); return
    }
    if (!Object.values(Role).includes(role)) {
      res.status(400).json({ error: 'Invalid role' }); return
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'Email already registered' }); return
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    })
    const payload = {
      userId: user.id,
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email
    }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } })
    res.status(201).json({ user, accessToken, refreshToken })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' }); return
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials' }); return
    }
    const payload = {
      userId: user.id,
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email
    }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } })
    const { passwordHash: _, ...userSafe } = user
    res.json({ user: userSafe, accessToken, refreshToken })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' }); return
    }
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired refresh token' }); return
    }
    const payload = verifyRefreshToken(refreshToken)
    const accessToken = signAccessToken({
      userId: payload.userId,
      id: payload.id,
      name: payload.name,
      role: payload.role,
      email: payload.email
    })
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
}

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }
    res.json({ message: 'Logged out successfully' })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
}