import { Router } from "express";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { UsersController } from "./users.controller";

const router = Router();

router.use(requireAuth);
router.patch("/me", asyncHandler(UsersController.updateMe));
router.post("/me/password", asyncHandler(UsersController.changePassword));
router.delete("/me", asyncHandler(UsersController.deleteMe));
router.get("/me/stats", asyncHandler(UsersController.stats));

export default router;
