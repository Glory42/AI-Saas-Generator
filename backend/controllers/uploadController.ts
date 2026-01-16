import { type Request, type Response } from "express";
import { asyncHandler } from '../utils/asyncHandler'
import { apiError } from '../utils/apiError'
import { StorageService } from '../utils/storageService';
import { ImageModel } from '../models/imageModel';

export const uploadImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        throw new apiError(400, 'No image file provided');
    }

    const imageUrl = await StorageService.uploadFile(req.file);

    const newImage = await ImageModel.create(imageUrl);
    
    res.status(201).json({
        success: true,
        imageUrl: newImage.original_url,
        id: newImage.id,
    });
});