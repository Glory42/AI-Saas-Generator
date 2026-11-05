import type { Request, Response } from "express";
import { ServiceUnavailableError } from "../../commons/errors/app-error";
import { HealthService } from "./health.service";

export class HealthController {
  // GET /api/health — liveness, never touches the database.
  static async live(_req: Request, res: Response): Promise<void> {
    res.status(200).json({ status: "ok" });
  }

  // GET /api/health/ready
  static async ready(_req: Request, res: Response): Promise<void> {
    if (!(await HealthService.isDatabaseUp())) throw new ServiceUnavailableError("Database is unreachable");
    res.status(200).json({ status: "ok", database: "up" });
  }
}
