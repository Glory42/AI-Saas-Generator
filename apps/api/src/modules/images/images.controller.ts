import type { Request, Response } from "express";
import { BadRequestError } from "../../commons/errors/app-error";
import { getAuth, getClientInfo } from "../../commons/http/request-context";
import { CursorQuerySchema, IdParamsSchema } from "../../commons/validation/common.schemas";
import { parseInput } from "../../commons/validation/parse-input";
import { toImageResponse, toImageWithGenerationsResponse } from "./helpers/image-mapper.helper";
import { ImagesService } from "./images.service";

export class ImagesController {
  // POST /api/images (multipart, field "image")
  static async upload(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    if (!req.file) throw new BadRequestError("Attach an image in the 'image' field");

    const image = await ImagesService.upload(user.id, req.file.buffer, getClientInfo(req));
    res.status(201).json({ image: toImageResponse(image) });
  }

  // GET /api/images
  static async list(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    const { limit, cursor } = parseInput(CursorQuerySchema, req.query);

    const page = await ImagesService.listPage(user.id, limit, cursor);
    res.status(200).json({ items: page.items.map(toImageWithGenerationsResponse), nextCursor: page.nextCursor });
  }

  // GET /api/images/:id
  static async getById(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    const { id } = parseInput(IdParamsSchema, req.params);

    const image = await ImagesService.getOwnedWithGenerations(user.id, id);
    res.status(200).json({ image: toImageWithGenerationsResponse(image) });
  }

  // DELETE /api/images/:id
  static async delete(req: Request, res: Response): Promise<void> {
    const { user } = getAuth(req);
    const { id } = parseInput(IdParamsSchema, req.params);

    await ImagesService.delete(user.id, id, getClientInfo(req));
    res.status(204).end();
  }
}
