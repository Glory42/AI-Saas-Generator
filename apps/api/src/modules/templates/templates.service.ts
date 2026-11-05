import { BadRequestError, NotFoundError } from "../../commons/errors/app-error";
import { TEMPLATES, TEMPLATES_BY_ID, type TemplateDefinition } from "./constants/templates.constants";

export class TemplatesService {
  static list(): readonly TemplateDefinition[] {
    return TEMPLATES;
  }

  static getOrThrowNotFound(id: string): TemplateDefinition {
    const template = TEMPLATES_BY_ID.get(id);
    if (!template) throw new NotFoundError("Template not found");
    return template;
  }

  // An unknown template in a generation request is a bad request, not a missing resource.
  static getForGeneration(id: string): TemplateDefinition {
    const template = TEMPLATES_BY_ID.get(id);
    if (!template) throw new BadRequestError(`Unknown template '${id}'`);
    return template;
  }
}
