import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { badRequest } from '../utils/response';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = (result.error as ZodError).issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      badRequest(res, 'Validation failed', details);
      return;
    }
    req.body = result.data;
    next();
  };
}