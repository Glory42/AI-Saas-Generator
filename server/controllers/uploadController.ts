import { type Request, type Response } from "express";
import cloudinary from "../config/cloudinary"; 
import supabase from "../config/database";


export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const cloudRes = await cloudinary.uploader.upload(dataURI, {
            folder: "ai-saas-app",
        });

        const { data, error } = await supabase
            .from('images')
            .insert([
                { original_url: cloudRes.secure_url }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            imageUrl: cloudRes.secure_url,
            id: data.id
        });
    } catch (err) {
        console.error('Upload Controller Error:', err);
        res.status(500).json({ error: 'Image upload failed' });
    }
};