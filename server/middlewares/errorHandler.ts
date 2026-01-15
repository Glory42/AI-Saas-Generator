import { type Request, type Response, type NextFunction } from 'express';
import { apiError } from '../utils/apiError.js';

export default function errorHandler(
    err: Error | apiError, 
    req: Request, 
    res: Response, 
    next: NextFunction) {
        const statusCode = err instanceof apiError ? err.statusCode : 500;
        const message = err.message || 'Internal Server Error';

        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            statusCode,
        });

        res.status(statusCode).json({
            error: message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
}