import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { AppError, type ErrorCode } from "../errors/app-error";
import { logger } from "../utils/logger";

type BodyParserError = Error & { type?: string };

const send = (res: Response, status: number, code: ErrorCode, message: string, details?: unknown): void => {
  res.status(status).json({ error: { message, code, ...(details === undefined ? {} : { details }) } });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  send(res, 404, "NOT_FOUND", `Route ${req.method} ${req.path} not found`);
};

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    send(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      send(res, 413, "PAYLOAD_TOO_LARGE", "Image must be 10 MB or smaller");
      return;
    }
    send(res, 400, "BAD_REQUEST", "Send exactly one file in the 'image' field");
    return;
  }

  const bodyError = err as BodyParserError;
  if (bodyError.type === "entity.too.large") {
    send(res, 413, "PAYLOAD_TOO_LARGE", "Request body too large");
    return;
  }
  if (bodyError.type?.startsWith("entity.parse")) {
    send(res, 400, "MALFORMED_BODY", "Malformed request body");
    return;
  }

  (req.log ?? logger).error({ err }, "Unhandled error");
  send(res, 500, "INTERNAL_SERVER_ERROR", "Internal server error");
};
