import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.single('image'), uploadImage);

export default router;