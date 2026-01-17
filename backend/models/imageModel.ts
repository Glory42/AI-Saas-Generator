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
        
    async updateGenerated(id: string, generatedUrl: string, templateId: string, prompt: string) {
        const { data, error } = await supabase
        .from('images')
        .update({ 
            generated_url: generatedUrl,
            template: templateId,
            prompt: prompt
        })
        .eq('id', id)
        .select()
        .single();

        if (error) throw new Error(`Failed to save AI result: ${error.message}`);
        return data;
    }
};