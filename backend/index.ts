import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/config.ts';
import userRoutes from './routes/userRoute';
import uploadRoutes from './routes/uploadRoute.ts';
import generateRoutes from "./routes/generateRoute";
import errorHandler from './middlewares/errorHandler.ts';
import notFoundHandler from './middlewares/404handler.ts';

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
});

// Upload-specific rate limiting
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: 'Upload limit exceeded, please try again later.',
});

app.use(limiter);
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://ai-saas-generator.vercel.app",
    ], 
    credentials: true
}));
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/generate', generateRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
});