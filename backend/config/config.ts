const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "JWT_TOKEN",
    "GEMINI_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
] as const;

const missingKeys = requiredEnvVars.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
    console.error("CRITICAL ERROR: Missing environment variables:");
    missingKeys.forEach((key) => { console.error(`  - ${key}`) });
    process.exit(1);
}

const env = {
    port: Number(process.env.PORT) || 5000, 
    NODE_ENV: process.env.NODE_ENV || "development",
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_KEY: process.env.SUPABASE_KEY!,
    JWT_TOKEN: process.env.JWT_TOKEN!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
}

export default env;