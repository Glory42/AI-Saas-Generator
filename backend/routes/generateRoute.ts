import { Router } from "express";
import { generateImage } from "../controllers/generateController";
import authToken from "../middlewares/authMiddleware";
import { generationLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post("/", authToken, generationLimiter, generateImage);

export default router;