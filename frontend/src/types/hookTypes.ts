export interface Template {
    id: string;
    label: string;
    systemPrompt?: string;
    modelTier: 'flash' | 'pro';
}
