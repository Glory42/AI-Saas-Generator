import { type Response, type Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { apiError } from "../utils/apiError";
import { AIService } from "../utils/aiService";
import { StorageService } from "../utils/storageService"; 
import { ImageModel } from "../models/imageModel";
import { TEMPLATES, type TemplateId } from "../config/templates";
import { AuditService } from "../utils/auditService";

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

    console.log(`Downloading original image: ${imageRecord.original_url}`);
    const imageResponse = await fetch(imageRecord.original_url);
    if (!imageResponse.ok) throw new apiError(400, "Failed to download original image");
    
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    console.log(`Generating with template: ${selectedTemplate.label}`);
    const { buffer, cost, hash, fromCache, cachedUrl } = await AIService.generateImage(
        selectedTemplate.systemPrompt, 
        imageBuffer, 
        "image/jpeg",
        selectedTemplate.modelTier || 'flash'
    );

    // CASE A: CACHE HIT (Instant & Free)
    if (fromCache && cachedUrl) {
        console.log("Cache Hit! Returning result immediately.");
        
        const clientIP = req.ip || req.socket.remoteAddress;
        await AuditService.log(userId, "IMAGE_GENERATED_CACHE", { 
            imageId, templateId, saved_cost: cost 
        }, clientIP);

        const updatedRecord = await ImageModel.updateGenerated(
            imageId, 
            cachedUrl, 
            templateId, 
            selectedTemplate.systemPrompt,
            0,    
            hash, 
            selectedTemplate.modelTier || 'flash'
        );

        res.status(200).json({
            success: true,
            data: updatedRecord,
            meta: { cached: true }
        });
        return; 
    }

    // CASE B: NEW GENERATION (Upload & Pay)
    const safeName = req.user?.email?.replace(/[^a-zA-Z0-9]/g, "_") || "user";
    const userFolder = `ai-saas-app/${safeName}`;
    
    console.log("☁️ Uploading result to Cloudinary...");
    const generatedUrl = await StorageService.uploadBuffer(buffer, "image/jpeg", userFolder);

    console.log("💾 Saving to Supabase (Cost: $" + cost + ")...");
    
    const updatedRecord = await ImageModel.updateGenerated(
        imageId, 
        generatedUrl, 
        templateId, 
        selectedTemplate.systemPrompt,
        cost, 
        hash,
        selectedTemplate.modelTier || 'flash'
    );

    const clientIP = req.ip || req.socket.remoteAddress;
    await AuditService.log(userId, "IMAGE_GENERATED", { 
        imageId, 
        templateId, 
        cost_usd: cost,
        tier: selectedTemplate.modelTier 
    }, clientIP);

    res.status(200).json({
        success: true,
        data: updatedRecord,
        meta: { cached: false }
    });
});