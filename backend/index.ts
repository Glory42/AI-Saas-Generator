import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/config.ts';
import StartupService from './utils/startupService';
import userRoutes from './routes/userRoute';
import uploadRoutes from './routes/uploadRoute';
import generateRoutes from "./routes/generateRoute";
import authRoutes from './routes/authRoute';
import templateRoutes from './routes/templateRoute';
import errorHandler from './middlewares/errorHandler';
import notFoundHandler from './middlewares/404handler';
import { generationLimiter } from './middlewares/rateLimiter';

const app = express();

app.set('trust proxy', 1);

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

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, 
    legacyHeaders: false,
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: 'Upload limit exceeded, please try again later.',
});

app.use(limiter);
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://saas.gorkemkaryol.dev",
    ], 
    credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/generate', generationLimiter, generateRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
    try {
        await StartupService.checkDatabaseConnection();
        await StartupService.validateExternalKeys();

        app.listen(config.port, () => {
            console.log(`Server is running on http://localhost:${config.port}`);
        });
    } catch (error) {
        console.error("Failed to start server: ", error);
        process.exit(1);
    }
}

startServer();