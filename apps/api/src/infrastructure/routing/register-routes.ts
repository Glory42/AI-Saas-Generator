import type { Express } from "express";
import adminRouter from "../../modules/admin/admin.routes";
import authRouter from "../../modules/auth/auth.routes";
import healthRouter from "../../modules/health/health.routes";
import imagesRouter from "../../modules/images/images.routes";
import templatesRouter from "../../modules/templates/templates.routes";
import usersRouter from "../../modules/users/users.routes";
import { localStorage } from "../storage";
import { createLocalFilesRouter } from "../storage/files.router";

export const registerRoutes = (app: Express): void => {
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/templates", templatesRouter);
  app.use("/api/images", imagesRouter);
  app.use("/api/admin", adminRouter);

  if (localStorage) {
    app.use("/api/files", createLocalFilesRouter(localStorage));
  }
};
