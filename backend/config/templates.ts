export const TEMPLATES = {
  "instagram-promo": {
    id: "instagram-promo",
    label: "Instagram Promo",
    systemPrompt: "Transform this image into a high-energy Instagram promotional post. Make the colors vibrant, add a subtle glow effect, and ensure the product is the clear center of attention. Keep it modern and trendy.",
    complexity: "complex" // Needs Pro for lighting effects, colors, and composition
  },
  "ecommerce-clean": {
    id: "ecommerce-clean",
    label: "E-Commerce Clean",
    systemPrompt: "Place this product on a pure, clean background (white or soft gray). Remove any clutter. Improve the lighting to look like professional studio photography. Focus on clarity and detail.",
    complexity: "simple" // Simple background replacement, Flash is sufficient
  },
  "lifestyle-outdoor": {
    id: "lifestyle-outdoor",
    label: "Lifestyle Outdoor",
    systemPrompt: "Place this product in a natural, outdoor setting with soft sunlight. Add natural elements like leaves or wood textures in the background, but keep them out of focus (bokeh).",
    complexity: "complex" // Complex scene generation, needs Pro for natural lighting and bokeh
  }
};

export type TemplateId = keyof typeof TEMPLATES;
export type TemplateComplexity = 'simple' | 'complex';