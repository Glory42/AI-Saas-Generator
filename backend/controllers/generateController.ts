import { type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { apiError } from "../utils/apiError";
import { AIService } from "../utils/aiService";
import { StorageService } from "../utils/storageService"; 
import { ImageModel } from "../models/imageModel";
import { TEMPLATES, type TemplateId, type TemplateComplexity } from "../config/templates";
import { type Request } from "express"; 


interface AuthRequest extends Request {
    user?: { id: string; email: string; username?: string };
}

export const generateImage = asyncHandler(async (req: Request, res: Response) => {
    const { imageId, templateId } = req.body;
    const userId = req.user?.id;

    // Input validation
    if (!userId) throw new apiError(401, "User not authenticated");
    if (!imageId) throw new apiError(400, "Image ID is required");
    if (!templateId) throw new apiError(400, "Template ID is required");
    
    const selectedTemplate = TEMPLATES[templateId as TemplateId];
    if (!selectedTemplate) throw new apiError(400, "Invalid Template ID");

    // Check cache first - Performance optimization #2
    console.log(`🔍 Checking cache for prompt combination...`);
    const cachedResult = await ImageModel.findByPromptHash(imageId, templateId, userId);
    if (cachedResult && cachedResult.generated_url) {
        console.log(`✅ Found cached result! Skipping AI generation.`);
        return res.status(200).json({
            success: true,
            data: cachedResult,
            cached: true
        });
    }

    const imageRecord = await ImageModel.getById(imageId);
    
    if (imageRecord.user_id !== userId) {
        throw new apiError(403, "You do not have permission to modify this image");
    }

    console.log(`⬇️ Downloading original image: ${imageRecord.original_url}`);
    const imageResponse = await fetch(imageRecord.original_url);
    if (!imageResponse.ok) throw new apiError(400, "Failed to download original image");
    
    let arrayBuffer: ArrayBuffer | null = null;
    let imageBuffer: Buffer | null = null;
    let generatedBuffer: Buffer | null = null;
    
    try {
        arrayBuffer = await imageResponse.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);

        // Validate image size before processing
        const maxSize = 50 * 1024 * 1024; // 50MB limit
        if (imageBuffer.length > maxSize) {
            throw new apiError(400, "Image too large (max 50MB)");
        }

        // Validate minimum size for processing
        const minSize = 1024; // 1KB minimum
        if (imageBuffer.length < minSize) {
            throw new apiError(400, "Image too small (min 1KB)");
        }

console.log(`🎨 Generating with template: ${selectedTemplate.label}`);
    console.log(`📊 Image size: ${(imageBuffer.length / 1024).toFixed(2)}KB`);
    
    } catch (error) {
        // Ensure cleanup even on error
        if (arrayBuffer) arrayBuffer = null;
        if (imageBuffer) imageBuffer = null;
        throw error;
    } finally {
        // Always cleanup arrayBuffer
        if (arrayBuffer) arrayBuffer = null;
    }

    if (!imageBuffer) {
        throw new apiError(500, "Image buffer is null - processing failed");
    }

    generatedBuffer = await AIService.generateImage(
        selectedTemplate.systemPrompt, 
        imageBuffer, 
        "image/png",
        selectedTemplate.complexity as TemplateComplexity // Pass complexity for smart model selection
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
        selectedTemplate.systemPrompt,
        userId // Pass userId for proper hash generation
    );

    res.status(200).json({
        success: true,
        data: updatedRecord
    });
    
    // Memory cleanup
    if (imageBuffer) imageBuffer = null;
    if (generatedBuffer) generatedBuffer = null;
});