import supabase from "../config/database";
import crypto from 'crypto';

export const ImageModel = {
    async create(url: string, userId: string) {
        const { data, error } = await supabase
        .from('images')
        .insert([{ 
            original_url: url,
            user_id: userId
            }])
        .select()
        .single();

        if (error) throw new Error(`Supabase Error: ${error.message}`);
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('id', id)
        .single();
        
        if (error) throw new Error(`Image not found: ${error.message}`);
        return data;
    },
        
// Generate hash for caching duplicate requests
    generatePromptHash(imageId: string, templateId: string, userId: string): string {
        return crypto.createHash('sha256')
            .update(`${imageId}:${templateId}:${userId}`) // Include userId for isolation
            .digest('hex');
    },

    // Check if generation already exists (caching)
    async findByPromptHash(imageId: string, templateId: string, userId: string) {
        const promptHash = this.generatePromptHash(imageId, templateId, userId); // Include userId in hash
        
        const { data, error } = await supabase
            .from('images')
            .select('*')
            .eq('prompt_hash', promptHash)
            .eq('user_id', userId) // Fix: Use userId for proper user isolation
            .single();
            
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw new Error(`Error checking prompt cache: ${error.message}`);
        }
            
        return data;
    },

    async updateGenerated(id: string, generatedUrl: string, templateId: string, prompt: string, userId: string) {
        // Generate prompt hash for caching
        const promptHash = this.generatePromptHash(id, templateId, userId);
        
        const { data, error } = await supabase
            .from('images')
            .update({ 
                generated_url: generatedUrl,
                template: templateId,
                prompt: prompt,
                prompt_hash: promptHash,
                generated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to save AI result: ${error.message}`);
        return data;
    }
};