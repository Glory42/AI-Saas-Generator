import { type Request, type Response } from 'express';
import User from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';
import { type UserRole } from '../types/User.js';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await User.getUsers();
    if (!users) {
        throw new apiError(404, 'No user found');
    }

    res.status(200).json({
        message: 'Users fetched successfully',
        users,
    });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
        throw new apiError(400, 'User id is required');
    }

    const user = await User.getUserById(id);
    if (!user) {
        throw new apiError(404, 'User not found');
    }
    
    res.status(200).json({
        message: 'User fetched successfully',
        user,
    });
});

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
        if (!userId) {
        throw new apiError(401, 'Unauthorized - User ID not found');
    }

    const userProfile = await User.getUserProfile(userId);
    if (!userProfile) {
        throw new apiError(404, 'No user found');
    }

    res.status(200).json({
        message: 'Public profile fetched successfully',
        userProfile,
    });
});

export const updateUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
        throw new apiError(400, 'User id is required');
    }

    const updates = req.body;
    if (!updates) {
        throw new apiError(400, 'Update data is required');
    }
    
    const updatedUser = await User.updateUser(id, updates);
    if (!updatedUser) {
        throw new apiError(404, 'User not found or update failed');
    }

    res.status(200).json({
        message: 'User updated successfully',
        updatedUser,
    });
});

export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const loggedIn = req.user?.id;
    if (!loggedIn) {
        throw new apiError(400, 'Profile id is required');
    }

    const updates = req.body;
    if (!updates) {
        throw new apiError(400, 'Update data is required');
    }

    const updatedUser = await User.updateUser(loggedIn!, updates);

    res.status(200).json({
        message: 'Profile updated successfully',
        updatedUser,
    });
});

export const updatedUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!id || Array.isArray(id)) {
        throw new apiError(400, 'User ID is required');
    }

    const validRoles: UserRole[] = ['user', 'admin'];
    if (!role || !validRoles.includes(role)) {
        throw new apiError(400, 'Valid role (user/admin) is required');
    }

    const updatedUser = await User.updateUser(id, { role });
    if (!updatedUser) {
        throw new apiError(404, 'User not found');
    }

    res.status(200).json({
        message: `User role updated to ${role}`,
        user: {
            email: updatedUser.email,
            username: updatedUser.username,
            role: updatedUser.role,
        }
    });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new apiError(400, 'User id is required');
        }

        const userExist = await User.getUserById(id);
        if (!userExist) {
            throw new apiError(404, 'User not found or could not be deleted');
        }

        await User.deleteUser(id);

        res.status(200).json({
            message: 'User deleted successfully',
            userExist,
        });
});