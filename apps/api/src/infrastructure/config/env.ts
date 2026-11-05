import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(5),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    PUBLIC_API_URL: z.url().default("http://localhost:5000"),

    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60),
    AUTH_ACCESS_COOKIE_NAME: z.string().min(1).default("aisg_access"),
    AUTH_REFRESH_COOKIE_NAME: z.string().min(1).default("aisg_refresh"),

    AI_PROVIDER: z.enum(["auto", "gemini", "local"]).default("auto"),
    GEMINI_API_KEY: optionalString,
    GEMINI_FLASH_IMAGE_MODEL: z.string().min(1).default("gemini-2.5-flash-image"),
    GEMINI_PRO_IMAGE_MODEL: z.string().min(1).default("gemini-3-pro-image-preview"),
    GEMINI_PROMPT_MODEL: z.string().min(1).default("gemini-2.5-flash"),
    HYBRID_RENDERER: z.enum(["pollinations", "none"]).default("pollinations"),
    GENERATION_DAILY_LIMIT: z.coerce.number().int().positive().default(20),

    STORAGE_PROVIDER: z.enum(["auto", "cloudinary", "local"]).default("auto"),
    CLOUDINARY_CLOUD_NAME: optionalString,
    CLOUDINARY_API_KEY: optionalString,
    CLOUDINARY_API_SECRET: optionalString,
    LOCAL_STORAGE_DIR: z.string().min(1).default("./storage"),
  })
  .superRefine((value, ctx) => {
    const hasCloudinary = Boolean(
      value.CLOUDINARY_CLOUD_NAME && value.CLOUDINARY_API_KEY && value.CLOUDINARY_API_SECRET,
    );

    if (value.AI_PROVIDER === "gemini" && !value.GEMINI_API_KEY) {
      ctx.addIssue({ code: "custom", path: ["GEMINI_API_KEY"], message: "required when AI_PROVIDER=gemini" });
    }
    if (value.STORAGE_PROVIDER === "cloudinary" && !hasCloudinary) {
      ctx.addIssue({ code: "custom", path: ["CLOUDINARY_CLOUD_NAME"], message: "Cloudinary credentials are required when STORAGE_PROVIDER=cloudinary" });
    }

    if (value.NODE_ENV !== "production") return;

    if (value.AI_PROVIDER === "local" || !value.GEMINI_API_KEY) {
      ctx.addIssue({ code: "custom", path: ["AI_PROVIDER"], message: "production requires GEMINI_API_KEY and a non-local AI provider" });
    }
    if (value.STORAGE_PROVIDER === "local" || !hasCloudinary) {
      ctx.addIssue({ code: "custom", path: ["STORAGE_PROVIDER"], message: "production requires Cloudinary credentials and a non-local storage provider" });
    }
  });

export type Env = z.infer<typeof envSchema>;

const formatIssues = (error: z.ZodError): string =>
  error.issues.map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`).join("\n");

const loadEnv = (): Env => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(`Invalid environment configuration:\n${formatIssues(result.error)}`);
    process.exit(1);
  }

  return result.data;
};

export const env = loadEnv();

export const resolvedAiProvider: "gemini" | "local" =
  env.AI_PROVIDER === "auto" ? (env.GEMINI_API_KEY ? "gemini" : "local") : env.AI_PROVIDER;

export const resolvedStorageProvider: "cloudinary" | "local" =
  env.STORAGE_PROVIDER === "auto"
    ? env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
      ? "cloudinary"
      : "local"
    : env.STORAGE_PROVIDER;
