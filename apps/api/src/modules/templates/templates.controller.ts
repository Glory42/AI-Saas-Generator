import type { Request, Response } from "express";
import { parseInput } from "../../commons/validation/parse-input";
import { TemplateParamsSchema } from "./dto/templates.dto";
import { toTemplateResponse } from "./helpers/template-mapper.helper";
import { TemplatesService } from "./templates.service";

export class TemplatesController {
  // GET /api/templates
  static async list(_req: Request, res: Response): Promise<void> {
    res.set("Cache-Control", "public, max-age=300");
    res.status(200).json({ templates: TemplatesService.list().map(toTemplateResponse) });
  }

  // GET /api/templates/:id
  static async getById(req: Request, res: Response): Promise<void> {
    const { id } = parseInput(TemplateParamsSchema, req.params);
    res.set("Cache-Control", "public, max-age=300");
    res.status(200).json({ template: toTemplateResponse(TemplatesService.getOrThrowNotFound(id)) });
  }
}
