import { Router } from "express";
import type { LocalDiskStorage } from "./local-disk.storage";

// Read-only file serving for the local-disk provider; Cloudinary serves its own URLs.
export const createLocalFilesRouter = (localDisk: LocalDiskStorage): Router => {
  const router = Router();

  router.get("/*key", (req, res) => {
    const segments = req.params.key;
    const key = Array.isArray(segments) ? segments.join("/") : String(segments);
    const filePath = localDisk.resolvePath(key);

    if (!filePath) {
      res.status(404).json({ error: { message: "File not found", code: "NOT_FOUND" } });
      return;
    }

    // The web app renders these from another origin in development.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.sendFile(filePath, { maxAge: "365d", immutable: true }, (error) => {
      if (error && !res.headersSent) {
        res.status(404).json({ error: { message: "File not found", code: "NOT_FOUND" } });
      }
    });
  });

  return router;
};
