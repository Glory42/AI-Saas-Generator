import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { HealthController } from "./health.controller";

const router = Router();

router.get("/", asyncHandler(HealthController.live));
router.get("/ready", asyncHandler(HealthController.ready));

export default router;
