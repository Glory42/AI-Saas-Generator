import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { GenerationsController } from "../generations/generations.controller";
import { MAX_UPLOAD_BYTES } from "./constants/images.constants";
import { ImagesController } from "./images.controller";

// Format is checked from the bytes in the service; multer only bounds size and count.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });

const router = Router();

router.use(requireAuth);
router.post("/", upload.single("image"), asyncHandler(ImagesController.upload));
router.get("/", asyncHandler(ImagesController.list));
router.get("/:id", asyncHandler(ImagesController.getById));
router.delete("/:id", asyncHandler(ImagesController.delete));
router.post("/:id/generations", asyncHandler(GenerationsController.create));

export default router;
