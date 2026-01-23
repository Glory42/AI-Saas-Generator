export interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    created_at: string;
}

export interface SystemStats {
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
    totalImages: number;
    totalGenerations: number;
    totalCost: number;
}

export interface ImageResult {
    id: string;
    original_url: string;
    generated_url: string;
    cost_usd: number;
    model_tier: string;
    template: string;
    status: string;
    created_at: string;
    generated_at: string;
}


export interface ImageRecord {
    id: string;
    original_url: string;
    generated_url?: string;
    template?: string;
    status: string;
    created_at: string;
    generated_at?: string;
    cost_usd?: number;
    model_tier?: string;
}