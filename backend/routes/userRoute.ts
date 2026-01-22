import Router from 'express';
import {
    getUsers,
    getUserById,
    getUserProfile,
    updateUserById,
    updateUserProfile,
    updatedUserRole,
    deleteUser,
} from '../controllers/userController.js';
import adminPrivilege from '../middlewares/adminPrivilege.js';
import userProtection from '../middlewares/userProtection.js';
import authToken from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authToken, adminPrivilege, getUsers);
router.put('/profile', authToken, userProtection, updateUserProfile);
router.get('/profile', authToken, getUserProfile);

router.get('/:id', authToken, adminPrivilege, getUserById);
router.put('/:id', authToken, adminPrivilege, updateUserById);
router.delete('/:id', authToken, adminPrivilege, deleteUser);
router.put('/:id/role', authToken, adminPrivilege, updatedUserRole);

export default router;