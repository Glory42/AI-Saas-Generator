import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import crypto from "crypto";
import env from '../config/config';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

const COSTS = {
    flash: 0.0005, // Cheap (~$0.50 per 1k requests)
    pro: 0.0050    // Premium (~$5.00 per 1k requests)
};

interface AIResponse {
    buffer: Buffer;
    cost: number;
    hash: string;
    fromCache: boolean;
    cachedUrl?: string;
}

export const AIService = {
    async generateImage(
        userPrompt: string, 
        originalBuffer: Buffer, 
        mimeType: string,
        modelTier: 'flash' | 'pro' = 'flash'
    ): Promise<AIResponse> {

        console.log("Optimizing image for AI analysis...");
        const lowResBuffer = await sharp(originalBuffer)
            .resize(512, 512, { fit: 'inside' })
            .jpeg({ quality: 60 })
            .toBuffer();

        const hashSum = crypto.createHash('sha256');
        hashSum.update(lowResBuffer);
        hashSum.update(userPrompt);
        hashSum.update(modelTier);
        const contentHash = hashSum.digest('hex');

        const { data: cached } = await supabase
            .from('images')
            .select('generated_url')
            .eq('content_hash', contentHash)
            .not('generated_url', 'is', null)
            .limit(1)
            .single();

        if (cached?.generated_url) {
            console.log(`Cache Hit! Serving existing result. (Hash: ${contentHash.substring(0, 8)}...)`);
            return {
                buffer: Buffer.from([]),
                cost: 0,
                hash: contentHash,
                fromCache: true,
                cachedUrl: cached.generated_url
            }
        }

        const modelName = modelTier === 'flash' ? "gemini-2.5-flash" : "gemini-3.0-pro";
        const currentCost = COSTS[modelTier];

        try {
            console.log(`🍌 Attempting Direct Image Gen (${modelName})...`);

            const imageModelName = "gemini-3-pro-image-preview";
            
            const model = genAI.getGenerativeModel({ 
                model: imageModelName,
                generationConfig: { responseModalities: ["IMAGE"] } as any
            });

            const imagePart = {
                inlineData: {
                    data: lowResBuffer.toString("base64"),
                    mimeType: "image/jpeg",
                },
            };

            const result = await model.generateContent([
                userPrompt, 
                imagePart
            ]);

            const response = await result.response;
            const parts = response.candidates?.[0]?.content?.parts;
            const generatedImagePart = parts?.find((part: any) => part.inlineData);

            if (generatedImagePart?.inlineData?.data) {
                console.log("Success! Generated with Gemini 3.0 Direct.");
                return {
                    buffer: Buffer.from(generatedImagePart.inlineData.data, "base64"),
                    cost: currentCost,
                    hash: contentHash,
                    fromCache: false
                }
            }
            
            } catch (error: any) {
                console.warn(`Gemini 3.0 Direct failed (${error.message}). Switching to Hybrid Mode...`);
            
            }

        try {
            console.log(`Awakening Brain (${modelName})...`);

            const brainModel = genAI.getGenerativeModel({ model: modelName });
            
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
                        data: lowResBuffer.toString("base64"),
                        mimeType: "image/jpeg"
                    }
                }
            ]);
            
            const enhancedPrompt = result.response.text().trim();
            console.log(`Art Direction: ${enhancedPrompt.substring(0, 50)}...`);

            const cleanPrompt = enhancedPrompt.replace(/Here is a prompt:|Prompt:/gi, "").trim();
            const safePrompt = encodeURIComponent(cleanPrompt);
            const seed = Math.floor(Math.random() * 1000000);

            const RENDER_URL = `https://pollinations.ai/p/${safePrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

            console.log("Rendering High-Res Asset with Flux...");
            const response = await fetch(RENDER_URL);

            if (!response.ok) throw new Error(`Render Error: ${response.statusText}`);

            const arrayBuffer = await response.arrayBuffer();

            return {
                buffer: Buffer.from(arrayBuffer),
                cost: currentCost,
                hash: contentHash,
                fromCache: false
            }

        } catch (error: any) {
            console.error("All Strategies Failed:", error.message);
            throw new Error(`AI Generation Failed: ${error.message}`);
        }
    }
};