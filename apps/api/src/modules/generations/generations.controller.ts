import type { Request, Response } from "express";
import { getAuth, getClientInfo } from "../../commons/http/request-context";
import { IdParamsSchema } from "../../commons/validation/common.schemas";
import { parseInput } from "../../commons/validation/parse-input";
import { CreateGenerationSchema } from "./dto/generations.dto";
import { GenerationsService } from "./generations.service";
import { toGenerationResponse } from "./helpers/generation-mapper.helper";

export class GenerationsController {
  // POST /api/images/:id/generations
  static async create(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    const { id } = parseInput(IdParamsSchema, req.params);
    const { templateId } = parseInput(CreateGenerationSchema, req.body);

    const { generation, cached } = await GenerationsService.create(user, id, templateId, getClientInfo(req));
    res.status(201).json({ generation: toGenerationResponse(generation), cached });
  }
}
