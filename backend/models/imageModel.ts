import supabase from "../config/database";

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

    async getByUserId(userId: string, limit = 50, offset = 0) {
        const { data, error } = await supabase
            .from('images')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) throw new Error(`Failed to fetch user images: ${error.message}`);
        return data;
    },
        
    async updateGenerated(
        id: string, 
        generatedUrl: string, 
        template: string, 
        prompt: string,
        cost: number = 0,
        hash: string = "",
        tier: string = "flash"
    ) {
        const { data, error } = await supabase
            .from('images')
            .update({
                generated_url: generatedUrl,
                template: template,
                prompt: prompt,
                status: 'completed',
                generated_at: new Date(),
                cost_usd: cost,
                content_hash: hash,
                model_tier: tier
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to save AI result: ${error.message}`);
        return data;
    }
};