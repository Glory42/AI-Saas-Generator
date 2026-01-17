// Type definitions for Gemini API to improve type safety
export interface GeminiContentPart {
    inlineData?: {
        data: string;
        mimeType: string;
    };
    text?: string;
}

export interface GeminiResponseCandidate {
    content?: {
        parts?: GeminiContentPart[];
    };
}

export interface GeminiGenerationConfig {
    responseModalities: string[];
}

export interface GeminiModelResponse {
    candidates?: GeminiResponseCandidate[];
    response?: {
        text?: () => string;
    };
}