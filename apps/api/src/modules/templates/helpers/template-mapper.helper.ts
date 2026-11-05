import type { TemplateDefinition } from "../constants/templates.constants";

// System prompts are product IP and stay server-side.
export const toTemplateResponse = (template: TemplateDefinition) => ({
  id: template.id,
  label: template.label,
  description: template.description,
  modelTier: template.modelTier,
});
