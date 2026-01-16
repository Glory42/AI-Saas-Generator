import { type Request, type Response, type NextFunction } from 'express';

export default function adminPrivilege(req: Request, res: Response, next: NextFunction) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
}