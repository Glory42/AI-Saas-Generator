interface Config {
    port: number;
    JWT_TOKEN: string;
    CONVEX_DEPLOYMENT: string;
    CONVEX_URL: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
}

const config: Config = {
    port: Number(process.env.PORT),
    JWT_TOKEN: String(process.env.JWT_TOKEN),
    CONVEX_DEPLOYMENT: String(process.env.CONVEX_DEPLOYMENT),
    CONVEX_URL: String(process.env.CONVEX_URL),
    CLOUDINARY_CLOUD_NAME: String(process.env.CLOUDINARY_CLOUD_NAME),
    CLOUDINARY_API_KEY: String(process.env.CLOUDINARY_API_KEY),
    CLOUDINARY_API_SECRET: String(process.env.CLOUDINARY_API_SECRET),
};
        
export default config;