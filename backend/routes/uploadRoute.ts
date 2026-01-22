import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadImage } from '../controllers/uploadController';
import authToken from '../middlewares/authMiddleware.js';
import userProtection from '../middlewares/userProtection.js';


const router = Router();
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Single file only
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
        }
    }
});

router.post('/', authToken, upload.single('image'), uploadImage);

export default router;