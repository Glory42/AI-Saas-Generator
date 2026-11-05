import { describe, expect, test } from "bun:test";
import { TEMPLATES, TEMPLATES_BY_ID } from "../../src/modules/templates/constants/templates.constants";
import { toTemplateResponse } from "../../src/modules/templates/helpers/template-mapper.helper";

describe("template catalog", () => {
  test("ids are unique slugs", () => {
    expect(TEMPLATES_BY_ID.size).toBe(TEMPLATES.length);
    for (const template of TEMPLATES) expect(template.id).toMatch(/^[a-z0-9-]+$/);
  });

  test("every template has a prompt, a positive prompt version and a valid tier", () => {
    for (const template of TEMPLATES) {
      expect(template.systemPrompt.length).toBeGreaterThan(40);
      expect(template.promptVersion).toBeGreaterThan(0);
      expect(["flash", "pro"]).toContain(template.modelTier);
    }
  });

  test("responses never include the system prompt", () => {
    for (const template of TEMPLATES) expect(toTemplateResponse(template)).not.toHaveProperty("systemPrompt");
  });
});
