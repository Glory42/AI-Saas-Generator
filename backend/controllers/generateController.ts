import { type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { apiError } from "../utils/apiError";
import { AIService } from "../utils/aiService";
import { StorageService } from "../utils/storageService"; 
import { ImageModel } from "../models/imageModel";
import { TEMPLATES, type TemplateId } from "../config/templates";
import { type Request } from "express";
import { AuditService } from "../utils/auditService"; 


interface AuthRequest extends Request {
    user?: { id: string; email: string; username?: string };
}

export const generateImage = asyncHandler(async (req: Request, res: Response) => {
    const { imageId, templateId } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new apiError(401, "User not authenticated");
    
    const selectedTemplate = TEMPLATES[templateId as TemplateId];
    if (!selectedTemplate) throw new apiError(400, "Invalid Template ID");

    const imageRecord = await ImageModel.getById(imageId);
    
    if (imageRecord.user_id !== userId) {
        throw new apiError(403, "You do not have permission to modify this image");
    }

    console.log(`⬇️ Downloading original image: ${imageRecord.original_url}`);
    const imageResponse = await fetch(imageRecord.original_url);
    if (!imageResponse.ok) throw new apiError(400, "Failed to download original image");
    
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    console.log(`🎨 Generating with template: ${selectedTemplate.label}`);
    const generatedBuffer = await AIService.generateImage(
        selectedTemplate.systemPrompt, 
        imageBuffer, 
        "image/png"
    );

    const safeName = req.user?.email?.replace(/[^a-zA-Z0-9]/g, "_") || "user";
    const userFolder = `ai-saas-app/${safeName}`;
    
    console.log("☁️ Uploading result to Cloudinary...");
    const generatedUrl = await StorageService.uploadBuffer(generatedBuffer, "image/png", userFolder);

    console.log("💾 Saving to Supabase...");
    const updatedRecord = await ImageModel.updateGenerated(
        imageId, 
        generatedUrl, 
        templateId, 
        selectedTemplate.systemPrompt
    );

    const clientIP = req.ip || req.socket.remoteAddress;
    await AuditService.log(userId, "IMAGE_GENERATED", { 
        imageId, 
        templateId, 
        template: selectedTemplate.label 
    }, clientIP);

    res.status(200).json({
        success: true,
        data: updatedRecord
    });
});