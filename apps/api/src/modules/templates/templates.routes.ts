import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { TemplatesController } from "./templates.controller";

const router = Router();

router.get("/", asyncHandler(TemplatesController.list));
router.get("/:id", asyncHandler(TemplatesController.getById));

export default router;
