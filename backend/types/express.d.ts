import 'express';
import { UserDTO } from './User.js';

declare global {
    namespace Express{
        interface Request {
            user?: {
                id: string,
                email?: string,
                role?: UserDTO['role'],
                username?: string,
                phone?: number,
            };
        }
    }
}