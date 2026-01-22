export interface TemplateConfig {
    id: string;
    label: string;
    systemPrompt: string;
    modelTier: "flash" | "pro";
}
export const TEMPLATES: Record<string, TemplateConfig> = {
  "instagram-promo": {
        id: "instagram-promo",
        label: "Instagram Promo",
        systemPrompt: "Transform this image into a high-energy Instagram promotional post. Make the colors vibrant, add a subtle glow effect, and ensure the product is the clear center of attention. Keep it modern and trendy.",
        modelTier: "pro",
  },
  "ecommerce-clean": {
        id: "ecommerce-clean",
        label: "E-Commerce Clean",
        systemPrompt: "Place this product on a pure, clean background (white or soft gray). Remove any clutter. Improve the lighting to look like professional studio photography. Focus on clarity and detail.",
        modelTier: "flash",
  },
  "lifestyle-outdoor": {
        id: "lifestyle-outdoor",
        label: "Lifestyle Outdoor",
        systemPrompt: "Place this product in a natural, outdoor setting with soft sunlight. Add natural elements like leaves or wood textures in the background, but keep them out of focus (bokeh).",
        modelTier: "pro"
  }
};

export type TemplateId = keyof typeof TEMPLATES;