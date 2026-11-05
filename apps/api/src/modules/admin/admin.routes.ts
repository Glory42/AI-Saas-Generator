import { Router } from "express";
import { requireAdmin } from "../../commons/middlewares/requireAdmin";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { AdminController } from "./admin.controller";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/stats", asyncHandler(AdminController.stats));
router.get("/users", asyncHandler(AdminController.listUsers));
router.patch("/users/:id/role", asyncHandler(AdminController.changeRole));
router.delete("/users/:id", asyncHandler(AdminController.deleteUser));
router.get("/audit-logs", asyncHandler(AdminController.auditLogs));

export default router;
