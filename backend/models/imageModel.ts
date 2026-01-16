import supabase from "../config/database";

export const ImageModel = {
  async create(url: string) {
    const { data, error } = await supabase
      .from('images')
      .insert([{ original_url: url }])
      .select()
      .single();

    if (error) throw new Error(`Supabase Error: ${error.message}`);
    return data;
  }
};