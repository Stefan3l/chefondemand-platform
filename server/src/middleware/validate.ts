import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

export const validate =
    (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if(!result.success) {
            throw new AppError("Dati non validi. Controlla i campi inseriti", 422);
        }
        (req as any).body = result.data;
        next();
    };