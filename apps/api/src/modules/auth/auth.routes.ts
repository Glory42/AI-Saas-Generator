import { Router } from "express";
import { optionalAuth, requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/register", asyncHandler(AuthController.register));
router.post("/login", asyncHandler(AuthController.login));
router.post("/refresh", asyncHandler(AuthController.refresh));
router.post("/logout", asyncHandler(AuthController.logout));
router.post("/logout-all", requireAuth, asyncHandler(AuthController.logoutAll));
router.get("/session", optionalAuth, asyncHandler(AuthController.session));

export default router;
