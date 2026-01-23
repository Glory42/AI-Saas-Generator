import { type Request, type Response } from 'express';
import User from '../models/userModel.js';
import { ImageModel } from '../models/imageModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';
import { type UserRole } from '../types/User.js';
import { AuditService } from '../utils/auditService.js';

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

    const clientIP = req.ip || req.socket.remoteAddress;
    await AuditService.log(req.user?.id || 'system', "USER_UPDATED", { 
        targetUserId: id, 
        updatedFields: Object.keys(updates) 
    }, clientIP);

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

    const clientIP = req.ip || req.socket.remoteAddress;
    await AuditService.log(loggedIn!, "USER_PROFILE_UPDATED", { 
        updatedFields: Object.keys(updates) 
    }, clientIP);

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

    const clientIP = req.ip || req.socket.remoteAddress;
    await AuditService.log(req.user?.id || 'system', "USER_ROLE_UPDATED", { 
        targetUserId: id, 
        newRole: role, 
        previousRole: updatedUser.role 
    }, clientIP);

    res.status(200).json({
        message: `User role updated to ${role}`,
        user: {
            email: updatedUser.email,
            username: updatedUser.username,
            role: updatedUser.role,
        }
    });
});

export const getUserImages = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new apiError(401, 'Unauthorized - User ID not found');
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const images = await ImageModel.getByUserId(userId, limit, offset);
    
    res.status(200).json({
        message: 'User images fetched successfully',
        images,
        pagination: {
            limit,
            offset,
            count: images.length
        }
    });
});

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new apiError(401, 'Unauthorized - User ID not found');
    }

    const images = await ImageModel.getByUserId(userId, 1000, 0); // Get up to 1000 images for stats

    const stats = {
        totalImages: images.length,
        totalGenerations: images.filter(img => img.generated_url).length,
        totalCost: images.reduce((sum, img) => sum + (img.cost_usd || 0), 0),
        flashGenerations: images.filter(img => img.model_tier === 'flash').length,
        proGenerations: images.filter(img => img.model_tier === 'pro').length,
        avgCostPerGeneration: 0,
        mostUsedTemplate: '',
        recentActivity: images.slice(0, 5).map(img => ({
            id: img.id,
            created_at: img.created_at,
            generated_at: img.generated_at,
            template: img.template,
            cost_usd: img.cost_usd
        }))
    };

    if (stats.totalGenerations > 0) {
        stats.avgCostPerGeneration = stats.totalCost / stats.totalGenerations;

        // Find most used template
        const templateCounts = images
            .filter(img => img.template)
            .reduce((acc, img) => {
                acc[img.template!] = (acc[img.template!] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
        stats.mostUsedTemplate = Object.entries(templateCounts)
            // @ts-ignore
            .sort(([,a], [,b]) => b - a)[0]?.[0] || ''; 
    }

    res.status(200).json({
        message: 'User stats fetched successfully',
        stats
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

    const clientIP = req.ip || req.socket.remoteAddress;
    
    await AuditService.log(req.user?.id || 'system', "USER_DELETED", { 
        deletedUserId: id, 
        deletedUserEmail: userExist.email 
    }, clientIP);

    await User.deleteUser(id);

    res.status(200).json({
        message: 'User deleted successfully',
        userExist,
    });
});