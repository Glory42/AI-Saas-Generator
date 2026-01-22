import jwt from 'jsonwebtoken';
import { type Request, type Response, type NextFunction} from 'express';
import config from '../config/config.js';
import { TokenService } from '../utils/tokenService.js';

export default async function authtoken(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = header.split(' ')[1];
    if (!token) {
        return res.status(500).json({ message: 'Token is missing' });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_TOKEN);
        
        if (typeof decoded === 'string') {
            return res.status(401).json({ error: 'Invalid token payload' });
        }

        // Validate required JWT properties exist
        if (!decoded.id || !decoded.email) {
            return res.status(401).json({ error: 'Invalid token: missing required fields' });
        }

        // Check if token is blacklisted
        if (decoded.jti) {
            const isBlacklisted = await TokenService.isAccessTokenBlacklisted(decoded.jti);
            if (isBlacklisted) {
                return res.status(401).json({ 
                    error: 'Token has been revoked',
                    code: 'TOKEN_REVOKED'
                });
            }
        }

        // Type-safe assignment with validation
        req.user = {
            id: String(decoded.id),
            email: String(decoded.email),
            role: (decoded.role === 'user' || decoded.role === 'admin') ? decoded.role : 'user',
            username: String(decoded.username || ''),
        };
        
        next();
    } catch (err) {
        return res.status(401).json({ 
            error: 'Invalid or expired token',
            code: 'AUTH_FAILED'
        });
    }
}  