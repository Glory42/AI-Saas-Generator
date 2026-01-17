import { GoogleGenerativeAI } from "@google/generative-ai";
import config from '../config/config';
import sharp from 'sharp';
import type { GeminiContentPart, GeminiResponseCandidate } from '../types/Gemini';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY!);

// Smart model selection based on template complexity and availability
function selectModel(complexity: 'simple' | 'complex'): string {
    // Use the official image generation model names
    return complexity === 'complex' 
        ? 'gemini-2.0-flash-exp'           // For complex tasks: lighting, composition
        : 'gemini-1.5-flash';              // For simple tasks: background replacement
}

export const AIService = {
    // Resize image to 512x512 for performance and cost reduction
    async resizeImage(imageBuffer: Buffer): Promise<Buffer> {
        try {
            console.log("🖼️ Resizing image to 512x512 for optimal performance...");
            
            const resizedBuffer = await sharp(imageBuffer)
                .resize(512, 512, {
                    fit: 'inside',
                    withoutEnlargement: true,
                    kernel: 'lanczos3' // High-quality resampling
                })
                .jpeg({ 
                    quality: 85,
                    progressive: true 
                })
                .toBuffer();
                
            console.log(`✅ Image resized: ${imageBuffer.length} → ${resizedBuffer.length} bytes (${Math.round((1 - resizedBuffer.length/imageBuffer.length) * 100)}% reduction)`);
            
            return resizedBuffer;
        } catch (error: any) {
            console.error("❌ Image resize failed:", {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            // Fallback to original image if resize fails
            return imageBuffer;
        }
    },

    async generateImage(userPrompt: string, imageBuffer: Buffer, mimeType: string, complexity: 'simple' | 'complex' = 'simple'): Promise<Buffer> {
        
        let resizedImageBuffer: Buffer | null = null;
        
        try {
            // Step 1: Resize image for performance and cost reduction
            resizedImageBuffer = await this.resizeImage(imageBuffer);
            
            // Step 2: Select appropriate model based on complexity
            const selectedModel = selectModel(complexity);
            console.log(`🤖 Using model: ${selectedModel} (complexity: ${complexity})`);
            
// Try official image generation models first
            const model = genAI.getGenerativeModel({ 
                model: selectedModel,
                // Note: responseModalities may not be supported in this SDK version
                // The API should still work even without this configuration
            });

const imagePart = {
              inlineData: {
              data: resizedImageBuffer.toString("base64"), // Use resized image
              mimeType: mimeType,
              },
          };

try {
                console.log(`🚀 Attempting image generation with ${selectedModel}...`);
                
                const result = await model.generateContent([
                    userPrompt, 
                    imagePart
                ]);

                // Handle different response formats between SDK versions
                let parts;
                if (result.response) {
                    const response = await result.response;
                    parts = response.candidates?.[0]?.content?.parts;
                } else if (result.candidates) {
                    // Some SDK versions return candidates directly
                    parts = result.candidates[0]?.content?.parts;
                } else {
                    throw new Error('Unexpected response format from Gemini API');
                }
                const generatedImagePart = parts?.find((part: GeminiContentPart) => part.inlineData);

                if (generatedImagePart?.inlineData?.data) {
                    console.log(`✅ Success! Generated with ${selectedModel}.`);
                    return Buffer.from(generatedImagePart.inlineData.data, "base64");
                }
                
                throw new Error(`${selectedModel} did not return an image part.`);
                
            } catch (configError: any) {
                console.error("🔥 Model configuration error:", {
                    error: configError.message,
                    stack: configError.stack,
                    timestamp: new Date().toISOString(),
                    model: selectedModel,
                    issue: "Model configuration failure"
                });
                
                // Re-throw as generation error
                throw new Error(`AI Model Configuration Failed: ${configError.message}`);
            }

        } catch (error: any) {
            console.error("🔥 Gemini 3.0 Direct failed:", {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                strategy: "direct_generation"
            });
            // Continue to hybrid mode is intentional fallback strategy
        }

        try {
            console.log("Awakening Gemini 3.0 Pro (Text Brain)...");

            const brainModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
            
            const enhancementPrompt = `
                You are a world-class AI Art Director.
                User Request: "${userPrompt}"
                
                Task: Analyze the attached image. Write a single, highly detailed text-to-image prompt to recreate this product shot with cinematic lighting and 8k realism.
                Describe the texture, lighting, and camera angle.
                Return ONLY the prompt string.
            `;

const result = await brainModel.generateContent([
                enhancementPrompt,
                {
                    inlineData: {
                        data: (resizedImageBuffer || imageBuffer).toString("base64"), // Fallback to original if resize failed
                        mimeType: mimeType
                    }
                }
            ]);
            
            const enhancedPrompt = result.response.text().trim();
            console.log(`Art Direction (Gemini 3): ${enhancedPrompt.substring(0, 60)}...`);

            const cleanPrompt = enhancedPrompt.replace(/Here is a prompt:|Prompt:/gi, "").trim();
            const safePrompt = encodeURIComponent(cleanPrompt);
            const seed = Math.floor(Math.random() * 1000000);
            const RENDER_URL = `https://pollinations.ai/p/${safePrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

            console.log("Rendering High-Res Asset with Flux...");
            const response = await fetch(RENDER_URL);

            if (!response.ok) throw new Error(`Render Error: ${response.statusText}`);

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);

        } catch (error: any) {
            // Cleanup memory on error
            if (resizedImageBuffer) resizedImageBuffer = null;
            console.error("🔥 All AI Strategies Failed:", {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                strategy: "all_failed"
            });
            throw new Error(`AI Generation Failed: ${error.message}`);
        } finally {
            // Cleanup memory regardless of success/failure
            if (resizedImageBuffer) resizedImageBuffer = null;
        }
    }
};