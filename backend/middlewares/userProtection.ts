import { type Request, type Response, type NextFunction } from 'express';

export default function userProtection(req: Request, res: Response, next: NextFunction) {
    const loggedIn = req.user?.id;

    if (req.user?.role === 'admin') {
        return next();
    }

    if (req.params.id !== loggedIn) {
        return res.status(403).json(
            { error: 'You are not allowed to access or modify other users data '}
        );
    }

    next();
}