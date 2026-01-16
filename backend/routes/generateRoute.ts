import { Router } from "express";
import { generateImage } from "../controllers/generateController";
import authToken from "../middlewares/authMiddleware";

const router = Router();

router.post("/", authToken, generateImage);

export default router;