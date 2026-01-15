import { type Request, type Response } from 'express';

export default function notFoundHandler(req: Request, res:Response) {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
    });
}