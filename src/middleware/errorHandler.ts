import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ErrorHandler]', err);

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({ success: false, error: 'A record with this value already exists.' });
        return;
      case 'P2025':
        res.status(404).json({ success: false, error: 'Record not found.' });
        return;
      case 'P2003':
        res.status(400).json({ success: false, error: 'Foreign key constraint failed.' });
        return;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, error: 'Invalid data provided.' });
    return;
  }

  // Generic fallback
  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred';

  res.status(500).json({ success: false, error: message });
}