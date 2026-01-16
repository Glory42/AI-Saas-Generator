import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController';
import authToken from '../middlewares/authMiddleware.js';
import userProtection from '../middlewares/userProtection.js';


const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', authToken, upload.single('image'), uploadImage);

export default router;