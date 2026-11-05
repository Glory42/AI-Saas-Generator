import type { ModelTier } from "../../../infrastructure/ai";

export type TemplateDefinition = {
  id: string;
  label: string;
  description: string;
  modelTier: ModelTier;
  // Bump when systemPrompt changes so cached generations made with the old prompt stop matching.
  promptVersion: number;
  systemPrompt: string;
};

export const TEMPLATES: readonly TemplateDefinition[] = [
  {
    id: "ecommerce-clean",
    label: "E-Commerce Clean",
    description: "Studio product shot on a seamless white or soft-gray background.",
    modelTier: "flash",
    promptVersion: 1,
    systemPrompt:
      "Place this product on a pure, clean background (white or soft gray). Remove any clutter. Improve the lighting to look like professional studio photography. Focus on clarity and detail.",
  },
  {
    id: "instagram-promo",
    label: "Instagram Promo",
    description: "Vibrant, high-energy social post with the product front and center.",
    modelTier: "pro",
    promptVersion: 1,
    systemPrompt:
      "Transform this image into a high-energy Instagram promotional post. Make the colors vibrant, add a subtle glow effect, and ensure the product is the clear center of attention. Keep it modern and trendy.",
  },
  {
    id: "lifestyle-outdoor",
    label: "Lifestyle Outdoor",
    description: "Natural outdoor scene in soft sunlight with a blurred background.",
    modelTier: "pro",
    promptVersion: 1,
    systemPrompt:
      "Place this product in a natural, outdoor setting with soft sunlight. Add natural elements like leaves or wood textures in the background, but keep them out of focus (bokeh).",
  },
  {
    id: "minimal-flatlay",
    label: "Minimal Flat Lay",
    description: "Top-down flat lay on a pastel surface with a few tasteful props.",
    modelTier: "flash",
    promptVersion: 1,
    systemPrompt:
      "Re-photograph this product as a top-down flat lay on a smooth pastel surface. Add two or three small, complementary props arranged with generous negative space. Use soft, even, shadow-light lighting. Keep the product unchanged and in sharp focus.",
  },
  {
    id: "luxury-dark",
    label: "Luxury Dark",
    description: "Moody premium look on dark stone with dramatic rim lighting.",
    modelTier: "pro",
    promptVersion: 1,
    systemPrompt:
      "Present this product as a luxury item on a dark marble or slate surface. Use dramatic low-key lighting with a crisp rim light that outlines the product, subtle reflections on the surface and a deep, near-black background. Keep the product's shape, colors and branding faithful.",
  },
  {
    id: "holiday-festive",
    label: "Holiday Festive",
    description: "Warm seasonal scene with bokeh lights and gift-wrap accents.",
    modelTier: "flash",
    promptVersion: 1,
    systemPrompt:
      "Place this product in a warm, festive holiday scene: soft golden bokeh lights in the background, a few tasteful gift-wrap and evergreen accents around it, cozy warm color grading. The product must stay the hero of the shot and remain unaltered.",
  },
];

export const TEMPLATES_BY_ID: ReadonlyMap<string, TemplateDefinition> = new Map(
  TEMPLATES.map((template) => [template.id, template]),
);
