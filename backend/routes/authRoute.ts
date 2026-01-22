import express from 'express';
import { register, login, refreshToken, logout, logoutAllDevices } from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';
import { authLimiter } from '../middlewares/rateLimiter';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', authMiddleware, logoutAllDevices);

export default router;