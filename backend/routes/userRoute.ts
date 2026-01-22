import Router from 'express';
import rateLimit from 'express-rate-limit';
import {
    getUsers,
    getUserById,
    getUserProfile,
    updateUserById,
    updateUserProfile,
    updatedUserRole,
    deleteUser,
} from '../controllers/userController.js';
import {
    register,
    login,
} from '../controllers/authController.js';
import adminPrivilege from '../middlewares/adminPrivilege.js';
import userProtection from '../middlewares/userProtection.js';
import authToken from '../middlewares/authMiddleware.js';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 auth attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
});

router.get('/', authToken, adminPrivilege, getUsers);
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.put('/profile', authToken, userProtection, updateUserProfile);
router.get('/profile', authToken, getUserProfile);

router.get('/:id', authToken, adminPrivilege, getUserById);
router.put('/:id', authToken, adminPrivilege, updateUserById);
router.delete('/:id', authToken, adminPrivilege, deleteUser);
router.put('/:id/role', authToken, adminPrivilege, updatedUserRole);

export default router;