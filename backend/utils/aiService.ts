import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from 'sharp';
import env from '../config/config';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);

export const AIService = {
    async generateImage(userPrompt: string, originalBuffer: Buffer, mimeType: string): Promise<Buffer> {
        console.log("Optimizing image for AI analysis...");
        const lowResBuffer = await sharp(originalBuffer)
            .resize(512, 512, { fit: 'inside' })
            .jpeg({ quality: 60 })
            .toBuffer();

        try {
        console.log("🍌 Attempting Gemini 3.0 Pro Image Preview (Nano Banana Pro)...");
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3-pro-image-preview",
            generationConfig: { responseModalities: ["IMAGE"] } as any
        });

        const imagePart = {
            inlineData: {
            data: lowResBuffer.toString("base64"),
            mimeType: mimeType,
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
            console.log("✅ Success! Generated with Gemini 3.0 Direct.");
            return Buffer.from(generatedImagePart.inlineData.data, "base64");
        }
        
        throw new Error("Gemini 3.0 did not return an image part.");

        } catch (error: any) {
        console.warn(`⚠️ Gemini 3.0 Direct failed (${error.message}). Switching to Hybrid Mode...`);
        
        }

        try {
        console.log("🧠 Awakening Gemini 3.0 Pro (Text Brain)...");

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
                    data: lowResBuffer.toString("base64"),
                    mimeType: mimeType
                }
            }
        ]);
        
        const enhancedPrompt = result.response.text().trim();
        console.log(`✨ Art Direction (Gemini 3): ${enhancedPrompt.substring(0, 60)}...`);

        const cleanPrompt = enhancedPrompt.replace(/Here is a prompt:|Prompt:/gi, "").trim();
        const safePrompt = encodeURIComponent(cleanPrompt);
        const seed = Math.floor(Math.random() * 1000000);
        const RENDER_URL = `https://pollinations.ai/p/${safePrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

        console.log("🎨 Rendering High-Res Asset with Flux...");
        const response = await fetch(RENDER_URL);

        if (!response.ok) throw new Error(`Render Error: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);

        } catch (error: any) {
        console.error("❌ All Strategies Failed:", error.message);
        throw new Error(`AI Generation Failed: ${error.message}`);
        }
    }
};