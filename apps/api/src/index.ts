import { randomUUID } from "node:crypto";
import cors from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { errorHandler, notFoundHandler } from "./commons/middlewares/errorHandler";
import { createApiLimiter, createCredentialLimiter } from "./commons/middlewares/rateLimiters";
import { requireTrustedOrigin } from "./commons/middlewares/requireTrustedOrigin";
import { logger } from "./commons/utils/logger";
import { activeStrategies } from "./infrastructure/ai";
import { env } from "./infrastructure/config/env";
import { isTrustedOrigin } from "./infrastructure/config/origins";
import { pool } from "./infrastructure/database/db";
import { registerRoutes } from "./infrastructure/routing/register-routes";
import { storage } from "./infrastructure/storage";

export type CreateAppOptions = {
  rateLimits?: { api?: number; credentials?: number };
};

export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();

  // Render and most PaaS hosts sit behind one proxy hop; req.ip must be the client, not the proxy.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      // Unknown origins get no CORS headers (the browser blocks them) rather than a 500.
      origin: (origin, callback) => callback(null, !origin || isTrustedOrigin(origin)),
      credentials: true,
    }),
  );
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers["x-request-id"];
        const id = typeof incoming === "string" && incoming.length > 0 && incoming.length <= 128 ? incoming : randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
    }),
  );

  app.use("/api", createApiLimiter(options.rateLimits?.api));
  app.use(["/api/auth/login", "/api/auth/register"], createCredentialLimiter(options.rateLimits?.credentials));
  app.use(requireTrustedOrigin);
  app.use(express.json({ limit: "100kb" }));

  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.type("text/plain").send("User-agent: *\nDisallow: /\n");
  });

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const startServer = () => {
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(
      { aiStrategies: activeStrategies, storage: storage.name },
      `API listening on http://localhost:${env.PORT}`,
    );
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`${signal} received, shutting down`);
    server.close(async (error) => {
      await pool.end().catch((poolError: unknown) => logger.error({ err: poolError }, "Failed to close database pool"));
      if (error) {
        logger.error({ err: error }, "Error while closing the HTTP server");
        process.exit(1);
      }
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
};

if (import.meta.main) {
  startServer();
}
