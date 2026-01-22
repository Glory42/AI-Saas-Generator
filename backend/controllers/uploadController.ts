import { type Request, type Response } from "express";
import { asyncHandler } from '../utils/asyncHandler'
import { apiError } from '../utils/apiError'
import { StorageService } from '../utils/storageService';
import { ImageModel } from '../models/imageModel';
import { AuditService } from '../utils/auditService';

export const uploadImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        throw new apiError(400, 'No image file provided');
    }

    if (!req.user || !req.user.email) {
        throw new apiError(401, "User not identified");
    }

    const safeName = req.user.email.replace(/[^a-zA-Z0-9]/g, "_");
    const userFolder = `ai-saas-app/${safeName}`;

    const imageUrl = await StorageService.uploadFile(req.file, userFolder);

    const newImage = await ImageModel.create(imageUrl, req.user.id);
    
    const clientIP = req.ip || req.socket.remoteAddress;
    await AuditService.log(req.user.id, "IMAGE_UPLOADED", { 
        imageUrl: newImage.original_url, 
        imageId: newImage.id 
    }, clientIP);

    res.status(201).json({
        success: true,
        imageUrl: newImage.original_url,
        id: newImage.id,
    });
});